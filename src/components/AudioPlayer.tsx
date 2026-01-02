import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

const AudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Set volume
        audio.volume = 0.4;

        const playAudio = async () => {
            try {
                audio.currentTime = 0;
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.log("Autoplay blocked by browser policy", error);
                setIsPlaying(false);

                // Add one-time click listener to start audio on user interaction
                const handleInteraction = async () => {
                    try {
                        await audio.play();
                        setIsPlaying(true);
                        document.removeEventListener('click', handleInteraction);
                    } catch (e) {
                        console.error("Audio play failed on interaction", e);
                    }
                };
                document.addEventListener('click', handleInteraction);
                return () => document.removeEventListener('click', handleInteraction);
            }
        };

        playAudio();
    }, []);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50">
            <audio
                ref={audioRef}
                src="/audio/bg-music.mp3"
                loop
                autoPlay
            />

            <button
                onClick={togglePlay}
                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
                aria-label={isPlaying ? "Mute background music" : "Play background music"}
            >
                {isPlaying ? (
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                    <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
                )}
            </button>
        </div>
    );
};

export default AudioPlayer;
