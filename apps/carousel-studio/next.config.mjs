/** @type {import('next').NextConfig} */
const nextConfig = {
  // Playwright is only used server-side for exporting slides to JPEG.
  serverExternalPackages: ['playwright'],
};
export default nextConfig;
