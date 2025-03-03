// Cloudflare Worker for Smart Redirects
// This worker detects in-app browsers and attempts to break out to the device's native browser

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  const stage = url.searchParams.get('stage') || '1'
  
  // If no URL is provided, return an error
  if (!targetUrl) {
    return new Response('Error: No target URL provided', { status: 400 })
  }
  
  try {
    // Validate the URL
    const decodedUrl = decodeURIComponent(targetUrl)
    new URL(decodedUrl)
    
    // Get the user agent to detect browser type
    const userAgent = request.headers.get('User-Agent') || ''
    
    // Check if this is an in-app browser
    const isInAppBrowser = /Instagram|FBAN|FBAV|Twitter|TweetDeck|Pinterest|Line|WeChat|Snapchat|LinkedIn|MicroMessenger|Slack|Discord|WhatsApp|Telegram|FB_IAB|FBIOS|Chrome.*Mobile|Android.*Chrome|Instagram|FBAN|FBAV/.test(userAgent)
    
    // Check if this is iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(/Windows Phone/.test(userAgent))
    
    // Check if this is Android
    const isAndroid = /Android/.test(userAgent)
    
    // This is the key part: we use a two-stage redirect process
    // Stage 1: Break out of in-app browser to device browser
    // Stage 2: Actually load the target URL in the device browser
    
    if (stage === '1' && isInAppBrowser) {
      // Stage 1: We're in an in-app browser, need to break out
      // Create the stage 2 URL (same worker, but with stage=2)
      const workerUrl = new URL(request.url)
      workerUrl.searchParams.set('stage', '2')
      const stage2Url = workerUrl.toString()
      
      // Create HTML response with techniques to break out of in-app browser
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
          <meta property="og:type" content="website">
          <meta property="og:title" content="External Link">
          <meta property="og:description" content="Open this link in external browser">
          <meta name="format-detection" content="telephone=no">
          <meta name="apple-mobile-web-app-capable" content="yes">
          <meta name="apple-mobile-web-app-status-bar-style" content="black">
          <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'">
          <meta http-equiv="X-Frame-Options" content="DENY">
          <meta http-equiv="refresh" content="0;URL='${stage2Url}'">
          <title>Opening in browser...</title>
          <script>
            // Try to break out of frames
            if (window.top !== window.self) {
              window.top.location.href = window.self.location.href;
            }
            
            function breakOut() {
              const nextUrl = "${stage2Url}";
              
              try {
                // For iOS in-app browsers, try multiple approaches
                if (${isIOS}) {
                  // iOS-specific handling
                  window.location.href = nextUrl;
                  window.setTimeout(function() {
                    window.location.replace(nextUrl);
                  }, 100);
                  window.setTimeout(function() {
                    window.top.location.href = nextUrl;
                  }, 200);
                  document.location.href = nextUrl;
                } 
                // For Android in-app browsers
                else if (${isAndroid}) {
                  // Android-specific handling
                  window.location.href = nextUrl;
                  window.setTimeout(function() {
                    window.location.replace(nextUrl);
                  }, 100);
                  window.setTimeout(function() {
                    window.open(nextUrl, '_system');
                  }, 200);
                }
                // For all other browsers
                else {
                  window.location.replace(nextUrl);
                }
              } catch (e) {
                // Fallback
                window.location.replace(nextUrl);
              }
            }
            
            // Execute redirect when page loads
            window.onload = breakOut;
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Opening in browser...</h1>
          <p>If you are not redirected automatically, <a href="${stage2Url}" id="redirect-link">click here</a>.</p>
          <script>
            // Try clicking the link programmatically
            document.getElementById('redirect-link').click();
          </script>
        </body>
        </html>
      `;
      
      // Return the HTML with appropriate headers
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "frame-ancestors 'none'",
          'Referrer-Policy': 'no-referrer',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } 
    else {
      // Stage 2: We're now in the device browser, redirect to the actual target URL
      // Or we weren't in an in-app browser to begin with
      
      // Create HTML response that immediately redirects to the target URL
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="0;URL='${decodedUrl}'">
          <title>Redirecting to ${decodedUrl}</title>
          <script>
            // Immediately redirect to the target URL
            window.location.replace("${decodedUrl}");
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Redirecting to website...</h1>
          <p>If you are not redirected automatically, <a href="${decodedUrl}">click here</a>.</p>
        </body>
        </html>
      `;
      
      // Return the HTML with appropriate headers
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Location': decodedUrl,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        status: 302
      });
    }
    
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 400 });
  }
} 