import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function devFetchProxy() {
  return {
    name: 'dev-fetch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/fetch', async (req, res) => {
        const requestUrl = new URL(req.url ?? '', 'http://localhost')
        const target = requestUrl.searchParams.get('url')

        if (!target) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing "url" query parameter.' }))
          return
        }

        let parsedTarget

        try {
          parsedTarget = new URL(target)
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid target URL.' }))
          return
        }

        if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Only HTTP and HTTPS URLs are supported.' }))
          return
        }

        try {
          const upstream = await fetch(parsedTarget, {
            headers: {
              accept: req.headers.accept ?? '*/*',
            },
          })

          res.statusCode = upstream.status
          res.setHeader(
            'Content-Type',
            upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8',
          )
          res.setHeader('Cache-Control', 'no-store')

          const body = Buffer.from(await upstream.arrayBuffer())
          res.end(body)
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Proxy request failed.',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), devFetchProxy()],
})
