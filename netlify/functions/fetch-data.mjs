export default async function fetchData(request) {
  const requestUrl = new URL(request.url)
  const target = requestUrl.searchParams.get('url')

  if (!target) {
    return jsonResponse(400, { error: 'Missing "url" query parameter.' })
  }

  let parsedTarget

  try {
    parsedTarget = new URL(target)
  } catch {
    return jsonResponse(400, { error: 'Invalid target URL.' })
  }

  if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
    return jsonResponse(400, { error: 'Only HTTP and HTTPS URLs are supported.' })
  }

  try {
    const upstream = await fetch(parsedTarget, {
      headers: {
        accept: request.headers.get('accept') ?? '*/*',
      },
    })

    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        'cache-control': 'no-store',
        'content-type': upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    return jsonResponse(502, {
      error: error instanceof Error ? error.message : 'Proxy request failed.',
    })
  }
}

export const config = {
  method: 'GET',
  path: '/api/fetch',
}

function jsonResponse(status, payload) {
  return Response.json(payload, {
    status,
    headers: {
      'cache-control': 'no-store',
    },
  })
}
