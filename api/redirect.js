export default function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // Validate the URL
        const targetUrl = decodeURIComponent(url);
        new URL(targetUrl);
        
        // Set headers that help force external browser
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
        res.setHeader('Content-Type', 'text/html');
        
        // Send an HTML page with meta refresh and JavaScript fallback
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-Frame-Options" content="DENY">
                <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'">
                <meta name="referrer" content="no-referrer">
                <meta http-equiv="refresh" content="0;URL='${targetUrl}'">
                <script>
                    window.onload = function() {
                        try {
                            window.top.location = '${targetUrl}';
                        } catch (e) {
                            window.location.replace('${targetUrl}');
                        }
                    };
                </script>
            </head>
            <body>
                <h1>Redirecting...</h1>
                <a href="${targetUrl}" id="redirect">Click here if not redirected automatically</a>
                <script>
                    document.getElementById('redirect').click();
                </script>
            </body>
            </html>
        `);
    } catch (e) {
        res.status(400).json({ error: 'Invalid URL provided' });
    }
} 