// Ambient module declarations to silence editor/TS server for packages that
// either provide no types in this workspace or where the editor may not
// have picked up installed @types yet. These are minimal fallbacks and
// can be removed once the upstream types are available to the TS server.

declare module '@react-three/fiber';
declare module '@react-three/drei';
declare module 'draco3d';

// d3 subpackages: provide loose module declarations if @types/* are not
// resolved by the TypeScript server in the editor.
declare module 'd3-color';
declare module 'd3-ease';
declare module 'd3-interpolate';
declare module 'd3-path';
declare module 'd3-scale';
declare module 'd3-time';
declare module 'd3-timer';

declare module 'json-schema';
declare module 'offscreencanvas';

// If anything else still complains, add a `declare module 'name';` here.
