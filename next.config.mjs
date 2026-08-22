/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Every image in /public/img is already hand-optimised WebP at a fixed size, and
  // the hero is art-directed with <picture> + a media-scoped preload. Routing them
  // through the optimiser would add a cold-start hop on the LCP path for no gain.
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
