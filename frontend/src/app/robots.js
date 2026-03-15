export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/legal', '/integrity', '/support'],
      // 🚀 Blocks Google from indexing protected/private routes
      disallow: ['/admin/', '/dashboard/', '/exam/', '/api/'],
    },
    sitemap: 'https://codescript.dedyn.io/sitemap.xml',
  }
}