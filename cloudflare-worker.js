// Cloudflare Worker for Smart Redirects
// This worker detects in-app browsers and attempts to break out to the device's native browser

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Handle the request and redirect to the target URL
 * @param {Request} request
 */
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
    
    // Get user agent to determine platform
    const userAgent = request.headers.get('User-Agent') || ''
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !/Windows Phone/.test(userAgent)
    const isInstagram = /Instagram/.test(userAgent)
    
    // For iOS Instagram, use a special technique
    if (isIOS && isInstagram) {
      // Create HTML with special meta tags and techniques
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta http-equiv="refresh" content="0;url=${decodedUrl}">
        <meta name="apple-itunes-app" content="app-id=389801252">
        <meta property="al:ios:url" content="instagram://user?username=instagram">
        <meta property="al:ios:app_store_id" content="389801252">
        <meta property="al:ios:app_name" content="Instagram">
        <title>Redirecting...</title>
        <script>
          // First attempt: direct navigation
          window.location.href = "${decodedUrl}";
          
          // Second attempt: try to open Instagram app first
          setTimeout(function() {
            window.location.href = "instagram://";
            
            // Then redirect to target URL
            setTimeout(function() {
              window.location.href = "${decodedUrl}";
            }, 300);
          }, 100);
        </script>
      </head>
      <body>
        <p>Redirecting to ${decodedUrl}...</p>
      </body>
      </html>
      `;
      
      return new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      });
    }
    
    // For other browsers, use a direct 302 redirect
    return Response.redirect(decodedUrl, 302);
    
  } catch (e) {
    return new Response('Invalid URL provided', { status: 400 })
  }
} 