const DEFAULT_ENDPOINT = 'https://rnsaffn.com/poison2/'
const LINK_COUNT = 50

export default async function examplePage(request, context) {
  const exampleId = Number.parseInt(context.params?.id ?? '', 10)

  if (!Number.isInteger(exampleId) || exampleId < 1 || exampleId > LINK_COUNT) {
    return htmlResponse(
      404,
      renderErrorPage('Example not found', 'This example page does not exist.'),
    )
  }

  try {
    const upstream = await fetch(DEFAULT_ENDPOINT, {
      headers: {
        accept: request.headers.get('accept') ?? '*/*',
      },
    })

    if (!upstream.ok) {
      return htmlResponse(
        upstream.status,
        renderErrorPage(
          `Request failed with status ${upstream.status}`,
          `Netlify could not load source data for Example ${exampleId}.`,
        ),
      )
    }

    const contentType = upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8'
    const bodyText = await readResponseBody(upstream, contentType)

    return htmlResponse(
      200,
      renderExamplePage({
        exampleId,
        contentType,
        bodyText,
      }),
    )
  } catch (error) {
    return htmlResponse(
      502,
      renderErrorPage(
        'Proxy request failed',
        error instanceof Error ? error.message : 'The upstream request failed.',
      ),
    )
  }
}

export const config = {
  method: 'GET',
  path: '/examples/:id',
}

async function readResponseBody(response, contentType) {
  if (contentType.includes('application/json')) {
    const json = await response.json()
    return JSON.stringify(json, null, 2)
  }

  return response.text()
}

function renderExamplePage({ exampleId, contentType, bodyText }) {
  const title = `Example ${exampleId} | Great software engineer code examples for everyday usage`
  const escapedData = escapeHtml(bodyText)
  const navLinks = Array.from({ length: LINK_COUNT }, (_, index) => {
    const id = index + 1
    const className = id === exampleId ? 'mini-link active' : 'mini-link'
    return `<a class="${className}" href="/examples/${id}">Example ${id}</a>`
  }).join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="Server-rendered example page with fetched source data." />
    <meta name="robots" content="index,follow" />
    <style>
      :root {
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: #1f2937;
        background:
          radial-gradient(circle at top, #fde68a 0%, #f8fafc 38%),
          linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      }
      * { box-sizing: border-box; }
      body { margin: 0; min-width: 320px; }
      .page {
        min-height: 100vh;
        padding: 24px;
        display: grid;
        place-items: center;
      }
      .card {
        width: min(100%, 960px);
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 20px;
        padding: 28px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
      }
      .eyebrow {
        margin: 0 0 8px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #b45309;
      }
      h1 {
        margin: 0;
        font-size: clamp(2rem, 6vw, 3rem);
        line-height: 1.05;
      }
      .intro { margin: 14px 0 16px; color: #475569; }
      .home-link-row {
        margin: 18px 0 22px;
      }
      .home-link {
        text-decoration: none;
        border-radius: 999px;
        padding: 10px 14px;
        border: 1px solid #cbd5e1;
        background: #fff;
        color: #0f172a;
        display: inline-block;
      }
      .content-grid {
        display: grid;
        grid-template-columns: minmax(220px, 240px) minmax(0, 1fr);
        gap: 18px;
      }
      .link-list {
        display: grid;
        gap: 10px;
        max-height: 480px;
        overflow: auto;
        padding-right: 4px;
      }
      .mini-link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        width: 100%;
        text-decoration: none;
        padding: 12px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 14px;
        background: #fff;
        color: #0f172a;
      }
      .mini-link.active {
        border-color: #1d4ed8;
        background: #dbeafe;
      }
      .link-meta {
        color: #64748b;
        font-size: 0.85rem;
        white-space: nowrap;
      }
      .output-panel {
        min-width: 0;
      }
      .status { margin: 0 0 16px; font-weight: 600; color: #475569; }
      pre {
        margin: 0;
        min-height: 260px;
        padding: 16px;
        overflow: auto;
        border-radius: 16px;
        background: #0f172a;
        color: #e2e8f0;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
      }
      @media (max-width: 640px) {
        .content-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="card">
        <p class="eyebrow">Server-rendered example page</p>
        <h1>Great software engineer code examples for everyday usage</h1>
        <p class="intro">Example ${exampleId} fetched fresh data from the shared source and rendered it directly into this HTML page.</p>
        <div class="home-link-row">
          <a class="home-link" href="/">Back to index</a>
        </div>
        <div class="content-grid">
          <nav class="link-list" aria-label="Example links">${navLinks}</nav>
          <section class="output-panel">
            <p class="status">Response type: ${escapeHtml(contentType)}</p>
            <pre>${escapedData}</pre>
          </section>
        </div>
      </section>
    </main>
  </body>
</html>`
}

function renderErrorPage(title, message) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="robots" content="noindex" />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background: #f8fafc;
        color: #1f2937;
      }
      .card {
        width: 100%;
        padding: 24px;
        border-radius: 18px;
        background: white;
        border: 1px solid #cbd5e1;
      }
      a { color: #1d4ed8; }
    </style>
  </head>
  <body>
    <section class="card">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <p><a href="/">Back to index</a></p>
    </section>
  </body>
</html>`
}

function htmlResponse(status, body) {
  return new Response(body, {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    },
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
