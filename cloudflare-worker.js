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
  
  // Get the target URL and platform-specific parameters
  const targetUrl = params.get('url')
  const androidIntent = params.get('android')
  const iosWebSearch = params.get('ios')
  const linkId = params.get('id')
  
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
    const isAndroid = /android/i.test(userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !/Windows Phone/.test(userAgent)
    
    // Set headers to help break out of in-app browsers
    const headers = new Headers({
      'Location': decodedUrl,
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    // Create HTML response with meta refresh as a fallback
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
      <meta http-equiv="refresh" content="0;url=${decodedUrl}">
      <meta property="og:type" content="website">
      <meta property="og:title" content="External Link">
      <meta property="og:description" content="Open this link in external browser">
      <title>Redirecting...</title>
      <script>
        // Try platform-specific deep links first
        function tryRedirect() {
          const targetUrl = "${decodedUrl}";
          ${isAndroid && androidIntent ? 
            `// Try Android Intent
            try {
              window.location.href = "${decodeURIComponent(androidIntent)}";
              // Fallback after a delay
              setTimeout(() => { window.location.href = targetUrl; }, 1000);
            } catch(e) {
              window.location.href = targetUrl;
            }` 
            : 
            isIOS && iosWebSearch ? 
            `// Try iOS-specific handling
            try {
              window.location.href = "${decodeURIComponent(iosWebSearch)}";
              // Fallback after a delay
              setTimeout(() => { window.location.href = targetUrl; }, 1000);
            } catch(e) {
              window.location.href = targetUrl;
            }` 
            : 
            `// Direct redirect
            window.location.href = targetUrl;`
          }
        }
        
        // Execute on page load
        window.onload = tryRedirect;
      </script>
    </head>
    <body>
      <p>Redirecting to ${decodedUrl}...</p>
    </body>
    </html>
    `
    
    // Return HTML response with redirect headers
    return new Response(htmlContent, {
      status: 200,
      headers: headers
    })
    
  } catch (e) {
    return new Response('Invalid URL provided', { status: 400 })
  }
} 