// One copy of three: everything resolves to the WebGPU build.
export * from 'three/webgpu';
export { CubeRenderTarget as WebGLCubeRenderTarget } from 'three/webgpu';

// The WebGPU build has no WebGL renderer and none of its GLSL tables. Some
// dependencies (drei through three-stdlib and gainmap-js) import these names
// at module scope without using them here, and some call them there too: in
// dev, the dependency optimiser bundles all of three-stdlib untree-shaken, and
// its Sky runs `UniformsUtils.clone(...)` as the module loads. So each name is
// an inert stand-in: property reads and calls hand the stand-in back, and only
// `new` throws, so creating a WebGL renderer fails with a clear message.
function unavailable(name: string): never {
  throw new Error(`three's ${name} is not available: this project renders with three/webgpu`);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a stand-in for any value a dependency reads off three
function standIn(name: string): any {
  const target = function () {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the proxy hands itself back for every property
  const proxy: any = new Proxy(target, {
    get: (_t, key) => (key === Symbol.toPrimitive ? () => `[${name}]` : proxy),
    apply: () => proxy,
    construct: () => unavailable(name),
  });
  return proxy;
}
export const WebGLRenderer = standIn('WebGLRenderer');
export const WebGLUtils = standIn('WebGLUtils');
export const ShaderChunk = standIn('ShaderChunk');
export const ShaderLib = standIn('ShaderLib');
export const UniformsLib = standIn('UniformsLib');
export const UniformsUtils = standIn('UniformsUtils');
