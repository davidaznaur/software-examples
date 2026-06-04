import { useEffect, useRef, useState } from 'react'

const DEFAULT_ENDPOINT = 'https://rnsaffn.com/poison2/'
const LINK_COUNT = 50

function createItems() {
  return Array.from({ length: LINK_COUNT }, (_, index) => ({
    id: index + 1,
    label: `Link ${index + 1}`,
    data: '',
    error: '',
    responseType: '',
    loadedAt: '',
  }))
}

export default function App() {
  const [items, setItems] = useState(() => createItems())
  const [activeId, setActiveId] = useState(1)
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
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === selectedId ? { ...item, error: '' } : item,
      ),
    )

    try {
      const response = await fetch(getRequestUrl(DEFAULT_ENDPOINT))

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        const result = await response.json()
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === selectedId
              ? {
                  ...item,
                  data: JSON.stringify(result, null, 2),
                  error: '',
                  responseType: 'JSON',
                  loadedAt: new Date().toLocaleTimeString(),
                }
              : item,
          ),
        )
      } else {
        const result = await response.text()
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === selectedId
              ? {
                  ...item,
                  data: result,
                  error: '',
                  responseType: contentType || 'Text',
                  loadedAt: new Date().toLocaleTimeString(),
                }
              : item,
          ),
        )
      }
    } catch (err) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === selectedId
            ? {
                ...item,
                data: '',
                responseType: '',
                error: err instanceof Error ? err.message : 'Something went wrong',
              }
            : item,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  function handleLinkClick(itemId) {
    setActiveId(itemId)
    void handleLoad(itemId)
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
        <p className="eyebrow">Minimal React + Vite</p>
        <h1>Great software engineer code examples for everyday usage</h1>
        <p className="intro">
          Browse the list and click any example to load fresh data from the same source.
        </p>
        <p className="note">
          Each link requests a new response and shows the result in the panel beside the list.
        </p>

        <div className="toolbar">
          <p className="selection">
            {loading ? `Loading ${activeItem.label}...` : `Click a link to load its data.`}
          </p>
        </div>

        <div className="content-grid">
          <nav className="link-list" aria-label="Data links">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`link-item${item.id === activeId ? ' active' : ''}`}
                onClick={() => handleLinkClick(item.id)}
              >
                <span>{item.label}</span>
                <span className="link-meta">{item.loadedAt ? 'Loaded' : 'Not loaded'}</span>
              </button>
            ))}
          </nav>

          <section className="output-panel">
            {activeItem.error ? <p className="status error">{activeItem.error}</p> : null}
            {activeItem.responseType ? (
              <p className="status">
                Response type: {activeItem.responseType}
                {activeItem.loadedAt ? ` at ${activeItem.loadedAt}` : ''}
              </p>
            ) : null}
            <pre className="output">
              {activeItem.data || 'Select a link to fetch data.'}
            </pre>
          </section>
        </div>
      </section>
    </main>
  )
}
