'use client';

import * as React from 'react';
import { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type ImageItem =
	| string
	| { src: string; alt?: string };

type LoadedTexture = {
	texture: THREE.Texture;
	isVideo?: boolean;
	video?: HTMLVideoElement | null;
};

interface FadeSettings {
	fadeIn: {
		start: number;
		end: number;
	};
	fadeOut: {
		start: number;
		end: number;
	};
}

interface BlurSettings {
	blurIn: {
		start: number;
		end: number;
	};
	blurOut: {
		start: number;
		end: number;
	};
	maxBlur: number;
}

interface InfiniteGalleryProps {
	images: ImageItem[];
	speed?: number;
	zSpacing?: number;
	visibleCount?: number;
	falloff?: { near: number; far: number };
	fadeSettings?: FadeSettings;
	blurSettings?: BlurSettings;
	className?: string;
	style?: React.CSSProperties;
}

const DEFAULT_DEPTH_RANGE = 80;
const MAX_HORIZONTAL_OFFSET = 4;
const MAX_VERTICAL_OFFSET = 3;

const createClothMaterial = () => {
	return new THREE.ShaderMaterial({
		transparent: true,
		uniforms: {
			map: { value: null },
			opacity: { value: 1.0 },
			blurAmount: { value: 0.0 },
			scrollForce: { value: 0.0 },
			time: { value: 0.0 },
			isHovered: { value: 0.0 },
		},
		vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vNormal = normal;
        
        vec3 pos = position;
        
        float curveIntensity = scrollForce * 0.3;
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;
        
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;
        
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;
          
          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }
        
        pos.z -= (curve + clothEffect + flagWave);
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
		fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        vec4 color = texture2D(map, vUv);
        
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / vec2(textureSize(map, 0));
          vec4 blurred = vec4(0.0);
          float total = 0.0;
          
          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, vUv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }
        
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);
        
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
	});
};

function ImagePlane({
	texture,
	position,
	scale,
	material,
}: {
	texture: THREE.Texture;
	position: [number, number, number];
	scale: [number, number, number];
	material: THREE.ShaderMaterial;
}) {
	const meshRef = useRef(null);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		if (material && texture) {
			material.uniforms.map.value = texture;
		}
	}, [material, texture]);

	useEffect(() => {
		if (material && material.uniforms) {
			material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0;
		}
	}, [material, isHovered]);

	return (
		<mesh
			ref={meshRef}
			position={position}
			scale={scale}
			material={material}
			onPointerEnter={() => setIsHovered(true)}
			onPointerLeave={() => setIsHovered(false)}
		>
			<planeGeometry args={[1, 1, 32, 32]} />
		</mesh>
	);
}

function GalleryScene({
	images,
	speed = 1,
	visibleCount = 8,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.15 },
		fadeOut: { start: 0.85, end: 0.95 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.9, end: 1.0 },
		maxBlur: 3.0,
	},
	isMobile,
}: Omit<InfiniteGalleryProps, 'className' | 'style'> & { isMobile: boolean }) {
	const [scrollVelocity, setScrollVelocity] = useState(0);
	const [autoPlay, setAutoPlay] = useState(true);
	const lastInteraction = useRef(Date.now());

	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	// Prepare lists for image/video textures
	const isVideoFor = (src: string) => /\.(mp4|webm|mov)$/i.test(src);

	// Preload image textures via useLoader (will suspend if used inside Suspense)
	const imageSrcs = normalizedImages.filter((i) => !isVideoFor(i.src)).map((i) => i.src);
	const loadedImageTextures = useLoader(THREE.TextureLoader, imageSrcs as string[]);

	// Build a unified textures array aligned with normalizedImages
	const textures: LoadedTexture[] = useMemo(() => {
		let imgIndex = 0;
		return normalizedImages.map((img) => {
			if (isVideoFor(img.src)) {
				const video = document.createElement('video');
				video.src = img.src;
				video.crossOrigin = 'anonymous';
				video.muted = true;
				video.loop = true;
				video.playsInline = true;
				video.preload = 'auto';
				// attempt to autoplay; browsers may block until user interaction
				video.play().catch(() => {});
				const vtex = new THREE.VideoTexture(video);
				vtex.minFilter = THREE.LinearFilter;
				vtex.magFilter = THREE.LinearFilter;
				vtex.format = THREE.RGBAFormat;
				vtex.needsUpdate = true;
				// ensure video is muted/looped/playsInline for autoplay policies
				video.muted = true;
				video.loop = true;
				video.playsInline = true;
				video.preload = 'auto';
				try {
					video.autoplay = true;
				} catch (e) {
					// ignore if property not writable
				}
				// try to play now; will fail silently if blocked
				video.play().catch(() => {});
				// register video globally so UI can trigger playback if autoplay is blocked
				try {
					(window as any).__galleryVideos = (window as any).__galleryVideos || [];
					(window as any).__galleryVideos.push(video);
				} catch (e) {
					// ignore
				}
				return { texture: vtex, isVideo: true, video };
			} else {
				const tex = loadedImageTextures[imgIndex++] as THREE.Texture;
				tex.needsUpdate = true;
				return { texture: tex, isVideo: false, video: null };
			}
		});
	}, [normalizedImages, loadedImageTextures]);

	// Cleanup video playback and textures on unmount
	useEffect(() => {
		return () => {
			textures.forEach((lt) => {
				if (lt.isVideo && lt.video) {
					try {
						lt.video.pause();
					} catch (e) {
						// ignore video pause errors
					}
					try {
						// remove from global registry
						if ((window as any).__galleryVideos) {
							(window as any).__galleryVideos = (window as any).__galleryVideos.filter((v: HTMLVideoElement) => v !== lt.video);
						}
					} catch (e) {
						// ignore
					}
				}
				try {
					const tex = lt.texture as unknown as { dispose?: () => void };
					if (typeof tex.dispose === 'function') tex.dispose();
				} catch (e) {
					// ignore dispose errors
				}
			});
		};
	}, [textures]);

	// Try to play videos on first user interaction (global fallback) to satisfy autoplay policies
	useEffect(() => {
		const playAll = () => {
			textures.forEach((t) => {
				if (t.isVideo && t.video) {
					t.video.play().catch(() => {});
				}
			});
		};
		document.addEventListener('pointerdown', playAll, { once: true });
		document.addEventListener('keydown', playAll, { once: true });
		return () => {
			document.removeEventListener('pointerdown', playAll);
			document.removeEventListener('keydown', playAll);
		};
	}, [textures]);

	const materials = useMemo(
		() => Array.from({ length: visibleCount }, () => createClothMaterial()),
		[visibleCount]
	);

	const spatialPositions = useMemo(() => {
		const positions: { x: number; y: number }[] = [];
		const maxHorizontalOffset = isMobile ? 1.0 : MAX_HORIZONTAL_OFFSET;
		const maxVerticalOffset = isMobile ? 1.2 : MAX_VERTICAL_OFFSET;

		for (let i = 0; i < visibleCount; i++) {
			if (isMobile) {
				// Mobile: Balanced distribution (Left, Center, Right)
				const positionType = i % 3; // 0=Center, 1=Right, 2=Left
				let side = 0;
				let horizontalRadius = 0.1;

				if (positionType === 0) {
					// Center
					side = 0;
					horizontalRadius = 0.1;
				} else if (positionType === 1) {
					// Right
					side = 1;
					horizontalRadius = 0.3 + (i % 3) * 0.1;
				} else {
					// Left
					side = -1;
					horizontalRadius = 0.3 + (i % 3) * 0.1;
				}

				const verticalRadius = 0.15 + (i % 4) * 0.12;
				const verticalDirection = (i % 4) === 0 ? 0 : ((i % 4) === 1 ? 0.6 : ((i % 4) === 2 ? -0.6 : 0.3));

				const x = side * horizontalRadius * maxHorizontalOffset;
				const y = verticalDirection * verticalRadius * maxVerticalOffset;

				positions.push({ x, y });
			} else {
				// Desktop: Distribute left, center, right pattern
				const positionType = i % 3; // 0 = center, 1 = right, 2 = left
				const side = positionType === 0 ? 0 : (positionType === 1 ? 1 : -1);
				const horizontalRadius = positionType === 0 ? 0.15 : (0.5 + ((i % 5) * 0.25));
				const verticalRadius = 0.2 + ((i % 4) * 0.25);

				// Vary vertical positions
				const verticalDirection = (i % 4) === 0 ? 0 : ((i % 4) === 1 ? 1 : ((i % 4) === 2 ? -1 : 0.5));

				const x = side * horizontalRadius * maxHorizontalOffset * 0.5;
				const y = verticalDirection * verticalRadius * maxVerticalOffset * 0.4;

				positions.push({ x, y });
			}
		}

		return positions;
	}, [visibleCount, isMobile]);

	const totalImages = normalizedImages.length;
	const depthRange = DEFAULT_DEPTH_RANGE;

	const planesData = useRef(
		Array.from({ length: visibleCount }, (_, i) => ({
			index: i,
			z: visibleCount > 0 ? ((depthRange / visibleCount) * i) % depthRange : 0,
			imageIndex: totalImages > 0 ? i % totalImages : 0,
			x: spatialPositions[i]?.x ?? 0,
			y: spatialPositions[i]?.y ?? 0,
		}))
	);

	useEffect(() => {
		planesData.current = Array.from({ length: visibleCount }, (_, i) => ({
			index: i,
			z:
				visibleCount > 0
					? ((depthRange / Math.max(visibleCount, 1)) * i) % depthRange
					: 0,
			imageIndex: totalImages > 0 ? i % totalImages : 0,
			x: spatialPositions[i]?.x ?? 0,
			y: spatialPositions[i]?.y ?? 0,
		}));
	}, [depthRange, spatialPositions, totalImages, visibleCount]);

	const handleWheel = useCallback(
		(event: WheelEvent) => {
			event.preventDefault();
			setScrollVelocity((prev) => prev + event.deltaY * 0.01 * speed);
			setAutoPlay(false);
			lastInteraction.current = Date.now();
		},
		[speed]
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
				setScrollVelocity((prev) => prev - 2 * speed);
				setAutoPlay(false);
				lastInteraction.current = Date.now();
			} else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
				setScrollVelocity((prev) => prev + 2 * speed);
				setAutoPlay(false);
				lastInteraction.current = Date.now();
			}
		},
		[speed]
	);

	useEffect(() => {
		const canvas = document.querySelector('canvas');
		if (canvas) {
			canvas.addEventListener('wheel', handleWheel, { passive: false });
			const playAllVideos = () => {
				textures.forEach((t) => {
					if (t.isVideo && t.video) {
						// try to play; may be blocked until user interaction
						t.video.play().catch(() => {
							// ignore play errors
						});
					}
				});
			};

			canvas.addEventListener('pointerdown', playAllVideos);
			document.addEventListener('keydown', handleKeyDown);

			// Touch support
			let touchStartY = 0;
			let touchStartX = 0;
			const handleTouchStart = (e: TouchEvent) => {
				touchStartY = e.touches[0].clientY;
				touchStartX = e.touches[0].clientX;
				setAutoPlay(false);
				lastInteraction.current = Date.now();
			};
			const handleTouchMove = (e: TouchEvent) => {
				const touchY = e.touches[0].clientY;
				const deltaY = touchStartY - touchY;
				// Using X delta too for horizontal swipe if preferred, but vertical scroll seems to be the main mechanism
				// Let's use simple vertical scroll emulation
				setScrollVelocity((prev) => prev + deltaY * 0.05 * speed);
				touchStartY = touchY;
				e.preventDefault(); // Prevent default scroll
			};

			canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
			canvas.addEventListener('touchmove', handleTouchMove, { passive: false });


			return () => {
				canvas.removeEventListener('wheel', handleWheel);
				canvas.removeEventListener('pointerdown', playAllVideos);
				document.removeEventListener('keydown', handleKeyDown);
				canvas.removeEventListener('touchstart', handleTouchStart);
				canvas.removeEventListener('touchmove', handleTouchMove);
			};
		}
	}, [handleWheel, handleKeyDown, speed, textures]);

	useEffect(() => {
		const interval = setInterval(() => {
			if (Date.now() - lastInteraction.current > 3000) {
				setAutoPlay(true);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	useFrame((state, delta) => {
		if (autoPlay) {
			setScrollVelocity((prev) => prev + 0.6 * delta);
		}

		setScrollVelocity((prev) => prev * 0.95);

		const time = state.clock.getElapsedTime();
		materials.forEach((material) => {
			if (material && material.uniforms) {
				material.uniforms.time.value = time;
				material.uniforms.scrollForce.value = scrollVelocity;
			}
		});

		// ensure video textures update each frame
		textures.forEach((lt) => {
			if (lt.isVideo) {
				const vt = lt.texture as THREE.VideoTexture;
				if (vt && typeof vt.needsUpdate !== 'undefined') vt.needsUpdate = true;
			}
		});

		const imageAdvance =
			totalImages > 0 ? visibleCount % totalImages || totalImages : 0;
		const totalRange = depthRange;

		planesData.current.forEach((plane, i) => {
			let newZ = plane.z + scrollVelocity * delta * 10;
			let wrapsForward = 0;
			let wrapsBackward = 0;

			if (newZ >= totalRange) {
				wrapsForward = Math.floor(newZ / totalRange);
				newZ -= totalRange * wrapsForward;
			} else if (newZ < 0) {
				wrapsBackward = Math.ceil(-newZ / totalRange);
				newZ += totalRange * wrapsBackward;
			}

			if (wrapsForward > 0 && imageAdvance > 0 && totalImages > 0) {
				plane.imageIndex =
					(plane.imageIndex + wrapsForward * imageAdvance) % totalImages;
			}

			if (wrapsBackward > 0 && imageAdvance > 0 && totalImages > 0) {
				const step = plane.imageIndex - wrapsBackward * imageAdvance;
				plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
			}

			plane.z = ((newZ % totalRange) + totalRange) % totalRange;
			plane.x = spatialPositions[i]?.x ?? 0;
			plane.y = spatialPositions[i]?.y ?? 0;

			const normalizedPosition = plane.z / totalRange;
			let opacity = 1;

			if (
				normalizedPosition >= fadeSettings.fadeIn.start &&
				normalizedPosition <= fadeSettings.fadeIn.end
			) {
				const fadeInProgress =
					(normalizedPosition - fadeSettings.fadeIn.start) /
					(fadeSettings.fadeIn.end - fadeSettings.fadeIn.start);
				opacity = fadeInProgress;
			} else if (normalizedPosition < fadeSettings.fadeIn.start) {
				opacity = 0;
			} else if (
				normalizedPosition >= fadeSettings.fadeOut.start &&
				normalizedPosition <= fadeSettings.fadeOut.end
			) {
				const fadeOutProgress =
					(normalizedPosition - fadeSettings.fadeOut.start) /
					(fadeSettings.fadeOut.end - fadeSettings.fadeOut.start);
				opacity = 1 - fadeOutProgress;
			} else if (normalizedPosition > fadeSettings.fadeOut.end) {
				opacity = 0;
			}

			opacity = Math.max(0, Math.min(1, opacity));

			let blur = 0;

			if (
				normalizedPosition >= blurSettings.blurIn.start &&
				normalizedPosition <= blurSettings.blurIn.end
			) {
				const blurInProgress =
					(normalizedPosition - blurSettings.blurIn.start) /
					(blurSettings.blurIn.end - blurSettings.blurIn.start);
				blur = blurSettings.maxBlur * (1 - blurInProgress);
			} else if (normalizedPosition < blurSettings.blurIn.start) {
				blur = blurSettings.maxBlur;
			} else if (
				normalizedPosition >= blurSettings.blurOut.start &&
				normalizedPosition <= blurSettings.blurOut.end
			) {
				const blurOutProgress =
					(normalizedPosition - blurSettings.blurOut.start) /
					(blurSettings.blurOut.end - blurSettings.blurOut.start);
				blur = blurSettings.maxBlur * blurOutProgress;
			} else if (normalizedPosition > blurSettings.blurOut.end) {
				blur = blurSettings.maxBlur;
			}

			blur = Math.max(0, Math.min(blurSettings.maxBlur, blur));

			const material = materials[i];
			if (material && material.uniforms) {
				material.uniforms.opacity.value = opacity;
				material.uniforms.blurAmount.value = blur;
			}
		});
	});

	if (normalizedImages.length === 0) return null;

	return (
		<>
			{planesData.current.map((plane, i) => {
				const loaded = textures[plane.imageIndex];
				const texture = loaded?.texture;
				const material = materials[i];

				if (!texture || !material) return null;

				const worldZ = plane.z - depthRange / 2;

				const texAny = texture as unknown as { image?: HTMLImageElement | HTMLVideoElement };
				const textureImage = texAny.image;
				let aspect = 1;
				if (textureImage) {
					if ('videoWidth' in textureImage && textureImage.videoWidth && textureImage.videoHeight) {
						aspect = textureImage.videoWidth / textureImage.videoHeight;
					} else if ('width' in textureImage && textureImage.width && textureImage.height) {
						aspect = textureImage.width / textureImage.height;
					}
				}

				const baseScale = isMobile ? 1.1 : 2.5;
				const scale: [number, number, number] =
					aspect > 1 ? [baseScale * aspect, baseScale, 1] : [baseScale, baseScale / aspect, 1];

				return (
					<ImagePlane
						key={plane.index}
						texture={texture}
						position={[plane.x, plane.y, worldZ]}
						scale={scale}
						material={material}
					/>
				);
			})}
		</>
	);
}

function FallbackGallery({ images }: { images: ImageItem[] }) {
	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : img
			),
		[images]
	);

	return (
		<div className="flex flex-col items-center justify-center h-full bg-background text-foreground">
			<p className="mb-4">WebGL not supported. Showing image list:</p>
			<div className="flex flex-wrap gap-2 justify-center">
				{normalizedImages.map((img, i) => {
					const isVideo = /\.(mp4|webm|mov)$/i.test(img.src);
					if (isVideo) {
						return (
							<video
								key={i}
								src={img.src}
								className="w-24 h-24 object-cover rounded"
								muted
								loop
								playsInline
								controls
							/>
						);
					}
					return (
						<img
							key={i}
							src={img.src}
							alt={img.alt}
							className="w-24 h-24 object-cover rounded"
						/>
					);
				})}
			</div>
		</div>
	);
}

export default function InfiniteGallery({
	images,
	className = 'h-96 w-full',
	style,
	fadeSettings = {
		fadeIn: { start: 0.05, end: 0.2 },
		fadeOut: { start: 0.7, end: 0.8 },
	},
	blurSettings = {
		blurIn: { start: 0.0, end: 0.1 },
		blurOut: { start: 0.7, end: 0.8 },
		maxBlur: 4.0,
	},
}: InfiniteGalleryProps) {
	const [webglSupported, setWebglSupported] = useState(true);

	useEffect(() => {
		try {
			const canvas = document.createElement('canvas');
			const gl =
				canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
			if (!gl) {
				setWebglSupported(false);
			}
		} catch (e) {
			setWebglSupported(false);
		}
	}, []);

	const [isMobile, setIsMobile] = useState(false);

	const hasVideos = useMemo(() => {
		const arr = images.map((img) => (typeof img === 'string' ? img : img.src));
		return arr.some((s) => /\.(mp4|webm|mov)$/i.test(s));
	}, [images]);

	const [videosEnabled, setVideosEnabled] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	if (!webglSupported) {
		return (
			<div className={className} style={style}>
				<FallbackGallery images={images} />
			</div>
		);
	}

	return (
		<div className={`${className} touch-none relative`} style={style}>
			{hasVideos && !videosEnabled && (
				<div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-auto">
					<div className="bg-background/80 backdrop-blur-sm p-6 rounded-lg border border-foreground/10 text-center">
						<p className="text-foreground mb-3">This gallery contains videos. Click to enable continuous playback (muted).</p>
						<button
							className="px-4 py-2 bg-foreground text-background rounded"
							onClick={() => {
								try {
									(window as any).__galleryVideos = (window as any).__galleryVideos || [];
									(window as any).__galleryVideos.forEach((v: HTMLVideoElement) => v.play().catch(() => {}));
								} catch (e) {}
								setVideosEnabled(true);
							}}
						>
							Enable videos
						</button>
					</div>
				</div>
			)}
			<Canvas camera={{ position: [0, 0, isMobile ? 10 : 5], fov: 60 }}>
				<GalleryScene
					images={images}
					fadeSettings={fadeSettings}
					blurSettings={blurSettings}
					isMobile={isMobile}
				/>
			</Canvas>
		</div>
	);
}
