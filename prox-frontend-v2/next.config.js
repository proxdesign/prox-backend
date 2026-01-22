/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Set turbopack root to this directory to avoid lockfile detection issues
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig