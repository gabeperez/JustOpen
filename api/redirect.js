export default function handler(req, res) {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        // Validate the URL
        new URL(url);
        
        // Set headers to force in-app browser
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
        
        // Redirect to the target URL
        res.redirect(301, url);
    } catch (e) {
        res.status(400).json({ error: 'Invalid URL provided' });
    }
} 