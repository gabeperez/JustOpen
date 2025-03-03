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
    
    // Detect if we're in an in-app browser
    const isInAppBrowser = /Instagram|FBAV|FBAN|Twitter|TikTok|WhatsApp|Line|Snapchat|Pinterest|WeChat|LinkedIn|KAKAOTALK/i.test(userAgent)
    
    // For iOS Instagram, we'll use a special approach
    if (isIOS && isInAppBrowser && /Instagram/i.test(userAgent)) {
      // Create a simple redirect response with Location header
      return Response.redirect(decodedUrl, 302)
    }
    
    // Set headers to help break out of in-app browsers
    const headers = new Headers({
      'Content-Type': 'text/html;charset=UTF-8',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    // Create HTML response with more aggressive breakout techniques
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
      <meta http-equiv="refresh" content="3;url=${decodedUrl}">
      <meta property="og:type" content="website">
      <meta property="og:title" content="External Link">
      <meta property="og:description" content="Open this link in external browser">
      <meta name="apple-itunes-app" content="app-id=305343404, app-argument=${decodedUrl}">
      <title>Opening in External Browser</title>
      <script>
        // More aggressive breakout techniques
        function breakOut() {
          const targetUrl = "${decodedUrl}";
          const isInAppBrowser = ${isInAppBrowser};
          
          // If we detect we're in an in-app browser, try more aggressive techniques
          if (isInAppBrowser) {
            ${isAndroid ? 
              `// Android-specific techniques
              try {
                // Try Android Intent first
                window.location.href = "${decodeURIComponent(androidIntent)}";
                
                // Try opening in Chrome
                setTimeout(() => {
                  window.location.href = "googlechrome://${decodedUrl.replace(/^https?:\/\//, '')}";
                }, 500);
                
                // Try Samsung Internet
                setTimeout(() => {
                  window.location.href = "samsunginternet://${decodedUrl.replace(/^https?:\/\//, '')}";
                }, 1000);
                
                // Final fallback
                setTimeout(() => {
                  window.location.href = targetUrl;
                }, 1500);
              } catch(e) {
                window.location.href = targetUrl;
              }`
              : 
              isIOS ?
              `// iOS-specific techniques
              try {
                // Direct approach - this often works better than replace()
                window.location.href = targetUrl;
                
                // Try x-web-search protocol
                setTimeout(() => {
                  window.location.href = "${decodeURIComponent(iosWebSearch)}";
                }, 300);
                
                // Try opening in Safari
                setTimeout(() => {
                  window.location.href = "x-web-search://?${decodedUrl}";
                }, 600);
                
                // Try opening in Chrome
                setTimeout(() => {
                  window.location.href = "googlechrome://${decodedUrl.replace(/^https?:\/\//, '')}";
                }, 900);
                
                // Final fallback
                setTimeout(() => {
                  document.location.href = targetUrl;
                }, 1200);
              } catch(e) {
                window.location.href = targetUrl;
              }`
              :
              `// Generic fallback
              window.location.href = targetUrl;`
            }
          } else {
            // If not in an in-app browser, just redirect normally
            window.location.href = targetUrl;
          }
        }
        
        // Execute on page load
        window.onload = breakOut;
        
        // Also try immediately
        setTimeout(breakOut, 100);
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          text-align: center;
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.5;
          background-color: #f8f9fa;
          color: #333;
        }
        .redirect-container {
          margin-top: 50px;
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #09f;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .manual-link {
          display: inline-block;
          margin-top: 20px;
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .manual-link:hover {
          background-color: #0056b3;
        }
        .instructions {
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="redirect-container">
        <h2>Opening link in external browser</h2>
        <div class="spinner"></div>
        <p>Attempting to open in your device's browser...</p>
        
        <a href="${decodedUrl}" class="manual-link">Open Manually</a>
        
        <div class="instructions">
          <p><strong>If automatic redirect doesn't work:</strong></p>
          ${isIOS ? 
            `<p>• Tap the share button (square with arrow) at the bottom of the screen</p>
             <p>• Select "Open in Safari" or your preferred browser</p>` 
            : 
            isAndroid ? 
            `<p>• Tap the three dots menu in the top right</p>
             <p>• Select "Open in Chrome" or your preferred browser</p>` 
            : 
            `<p>• Try opening this link outside of the current app</p>`
          }
        </div>
      </div>
    </body>
    </html>
    `
    
    // Return HTML response with proper content type
    return new Response(htmlContent, {
      status: 200,
      headers: headers
    })
    
  } catch (e) {
    return new Response('Invalid URL provided', { status: 400 })
  }
} 