export async function handler(event) {
  const target = event.queryStringParameters?.url

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
        accept: event.headers?.accept ?? '*/*',
      },
    })

    const body = Buffer.from(await upstream.arrayBuffer()).toString('base64')

    return {
      statusCode: upstream.status,
      isBase64Encoded: true,
      headers: {
        'cache-control': 'no-store',
        'content-type': upstream.headers.get('content-type') ?? 'text/plain; charset=utf-8',
      },
      body,
    }
  } catch (error) {
    return jsonResponse(502, {
      error: error instanceof Error ? error.message : 'Proxy request failed.',
    })
  }
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  }
}
