// Cloudflare Worker for Smart Redirects
// This worker detects in-app browsers and attempts to break out to the device's native browser

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  const stage = url.searchParams.get('stage') || '1'
  const forceWeb = url.searchParams.get('forceweb') === 'true'
  
  // If no URL is provided, return an error
  if (!targetUrl) {
    return new Response('Error: No target URL provided', { status: 400 })
  }
  
  try {
    // Validate the URL
    const decodedUrl = decodeURIComponent(targetUrl)
    const parsedUrl = new URL(decodedUrl)
    
    // Get the user agent to detect browser type
    const userAgent = request.headers.get('User-Agent') || ''
    
    // Check if this is an in-app browser
    const isInAppBrowser = /Instagram|FBAN|FBAV|Twitter|TweetDeck|Pinterest|Line|WeChat|Snapchat|LinkedIn|MicroMessenger|Slack|Discord|WhatsApp|Telegram|FB_IAB|FBIOS|Chrome.*Mobile|Android.*Chrome|Instagram|FBAN|FBAV/.test(userAgent)
    
    // Check if this is iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(/Windows Phone/.test(userAgent))
    
    // Check if this is Android
    const isAndroid = /Android/.test(userAgent)

    // Modify the URL to force web version if needed
    let finalUrl = decodedUrl
    
    if (forceWeb) {
      // Force web versions of common services
      const hostname = parsedUrl.hostname.toLowerCase()
      
      // YouTube
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        // Ensure it's the web version
        const videoId = hostname.includes('youtu.be') 
          ? parsedUrl.pathname.substring(1) 
          : new URLSearchParams(parsedUrl.search).get('v')
        
        if (videoId) {
          finalUrl = `https://www.youtube.com/watch?v=${videoId}&app=desktop`
        }
      }
      
      // Twitter/X
      else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
        // Add parameters to force web view
        parsedUrl.searchParams.set('nw', '1')
        finalUrl = parsedUrl.toString()
      }
      
      // Instagram
      else if (hostname.includes('instagram.com')) {
        finalUrl = `https://www.instagram.com${parsedUrl.pathname}?igshid=forceweb`
      }
      
      // Facebook
      else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
        finalUrl = `https://www.facebook.com${parsedUrl.pathname}?_rdr=forceweb`
      }
      
      // TikTok
      else if (hostname.includes('tiktok.com')) {
        finalUrl = `https://www.tiktok.com${parsedUrl.pathname}?is_copy_url=1&is_from_webapp=v1`
      }
      
      // Reddit
      else if (hostname.includes('reddit.com')) {
        finalUrl = `https://www.reddit.com${parsedUrl.pathname}?utm_source=forceweb`
      }
    }
    
    // This is the key part: we use a two-stage redirect process
    // Stage 1: Break out of in-app browser to device browser
    // Stage 2: Actually load the target URL in the device browser
    
    if (stage === '1' && isInAppBrowser) {
      // Stage 1: We're in an in-app browser, need to break out
      // Create the stage 2 URL (same worker, but with stage=2)
      const workerUrl = new URL(request.url)
      workerUrl.searchParams.set('stage', '2')
      workerUrl.searchParams.set('forceweb', 'true') // Add forceweb parameter
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
      // Use HTML to force browser-based opening rather than native app opening
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="refresh" content="0;URL='${finalUrl}'">
          <title>Opening in browser...</title>
          <script>
            // Force opening in browser by using a slight delay
            window.onload = function() {
              setTimeout(function() {
                // Use window.open with _blank to force browser
                const newWindow = window.open("${finalUrl}", "_blank");
                
                // If window.open didn't work, try other methods
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                  window.location.href = "${finalUrl}";
                }
              }, 100);
            };
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h1>Opening website in browser...</h1>
          <p>If you are not redirected automatically, <a href="${finalUrl}" target="_blank" id="redirect-link">click here</a>.</p>
          <script>
            // Try clicking the link programmatically with a delay
            setTimeout(function() {
              document.getElementById('redirect-link').click();
            }, 200);
          </script>
        </body>
        </html>
      `;
      
      // Return the HTML with appropriate headers
      // Note: We're not using a 302 redirect here because that can trigger native apps
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 400 });
  }
} 