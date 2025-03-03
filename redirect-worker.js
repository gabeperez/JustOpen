addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = url.searchParams
  
  // Get the target URL
  const targetUrl = params.get('url')
  
  if (!targetUrl) {
    return new Response('No URL parameter provided', { status: 400 })
  }
  
  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(targetUrl)
    
    // Validate the URL
    new URL(decodedUrl)
    
    // Simple redirect to the target URL
    return Response.redirect(decodedUrl, 302)
    
  } catch (e) {
    return new Response('Invalid URL provided', { status: 400 })
  }
} 