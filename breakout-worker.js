addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const params = url.searchParams
  
  // Get the target URL and destination worker URL
  const targetUrl = params.get('url')
  const destinationWorker = params.get('dest') || 'https://redirect.perez-jg22.workers.dev'
  
  if (!targetUrl) {
    return new Response('No URL parameter provided', { status: 400 })
  }
  
  try {
    // Create the URL for the second worker
    const secondWorkerUrl = `${destinationWorker}?url=${targetUrl}`
    
    // Set headers to help break out of in-app browsers
    const headers = new Headers({
      'Content-Type': 'text/html;charset=UTF-8',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    // Create HTML that focuses solely on breaking out of in-app browsers
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <meta http-equiv="refresh" content="2;url=${secondWorkerUrl}">
      <title>Opening in External Browser</title>
      <script>
        // Store the destination in localStorage for retrieval
        localStorage.setItem('redirectDestination', '${secondWorkerUrl}');
        
        // Focus solely on breaking out
        function breakOut() {
          // For iOS, try to force Safari
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            // Try to open a blank page first
            window.location.replace('about:blank');
            
            // Then try to redirect to the second worker
            setTimeout(() => {
              window.location.replace('${secondWorkerUrl}');
            }, 500);
          } else {
            // For other platforms, just redirect
            window.location.replace('${secondWorkerUrl}');
          }
        }
        
        // Execute immediately
        breakOut();
      </script>
    </head>
    <body style="text-align: center; font-family: sans-serif;">
      <p>Opening in external browser...</p>
    </body>
    </html>
    `
    
    return new Response(htmlContent, {
      status: 200,
      headers: headers
    })
    
  } catch (e) {
    return new Response('Invalid URL provided', { status: 400 })
  }
} 