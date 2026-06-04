import { useEffect, useRef, useState } from 'react'

const DEFAULT_ENDPOINT = 'https://rnsaffn.com/poison2/'
const LINK_COUNT = 50

function createItems() {
  return Array.from({ length: LINK_COUNT }, (_, index) => ({
    id: index + 1,
    label: `Link ${index + 1}`,
  }))
}

export default function App() {
  const [items, setItems] = useState(() => createItems())
  const [activeId, setActiveId] = useState(1)
  const [data, setData] = useState('')
  const [error, setError] = useState('')
  const [responseType, setResponseType] = useState('')
  const [loadedAt, setLoadedAt] = useState('')
  const [loading, setLoading] = useState(false)
  const hasLoadedInitialItem = useRef(false)

  function getRequestUrl(rawEndpoint) {
    const parsedUrl = new URL(rawEndpoint, window.location.origin)
    const isCrossOrigin = parsedUrl.origin !== window.location.origin
    const isHttpRequest = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'

    if (isCrossOrigin && isHttpRequest) {
      return `/api/fetch?url=${encodeURIComponent(parsedUrl.toString())}`
    }

    return parsedUrl.toString()
  }

  async function handleLoad(selectedId = activeId) {
    setLoading(true)
    setActiveId(selectedId)
    setError('')

    try {
      const response = await fetch(getRequestUrl(DEFAULT_ENDPOINT))

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        const result = await response.json()
        setData(JSON.stringify(result, null, 2))
        setResponseType('JSON')
        setLoadedAt(new Date().toLocaleTimeString())
      } else {
        const result = await response.text()
        setData(result)
        setResponseType(contentType || 'Text')
        setLoadedAt(new Date().toLocaleTimeString())
      }
    } catch (err) {
      setData('')
      setResponseType('')
      setLoadedAt('')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasLoadedInitialItem.current) {
      return
    }

    hasLoadedInitialItem.current = true
    void handleLoad(1)
  }, [])

  const activeItem = items.find((item) => item.id === activeId) ?? items[0]

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Crawler-Friendly Example Index</p>
        <h1>Great software engineer code examples for everyday usage</h1>
        <p className="intro">
          Browse 50 real links. Each one points to its own crawlable page and loads fresh data
          from the same source.
        </p>
        <p className="note">
          The preview panel below auto-loads the first example when someone lands on the homepage.
        </p>

        <div className="toolbar">
          <p className="selection">
            {loading ? `Loading preview for ${activeItem.label}...` : `Open a link to visit its page.`}
          </p>
        </div>

        <div className="content-grid">
          <nav className="link-list" aria-label="Data links">
            {items.map((item) => (
              <a
                key={item.id}
                className={`link-item${item.id === activeId ? ' active' : ''}`}
                href={`/examples/${item.id}`}
              >
                <span>{item.label}</span>
                <span className="link-meta">Open page</span>
              </a>
            ))}
          </nav>

          <section className="output-panel">
            {error ? <p className="status error">{error}</p> : null}
            {responseType ? (
              <p className="status">
                Preview response type: {responseType}
                {loadedAt ? ` at ${loadedAt}` : ''}
              </p>
            ) : null}
            <pre className="output">{data || 'Preview data will appear here.'}</pre>
          </section>
        </div>
      </section>
    </main>
  )
}
