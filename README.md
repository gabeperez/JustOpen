# JustOpen - Smart Link Redirector

A solution for breaking out of in-app browsers (like Instagram, Facebook, etc.) and ensuring links open properly in the device's native browser.

## The Problem

When users click links in social media apps like Instagram or Facebook, they often open in the app's built-in browser. This creates several issues:

1. Limited functionality compared to native browsers
2. Privacy concerns as the app can track browsing
3. Links sometimes fail to load properly when breaking out to the native browser

This project specifically addresses the third issue - ensuring that when a link breaks out of an in-app browser to the device's native browser, the intended URL actually loads properly instead of showing a blank/black page.

## How It Works

The solution uses a two-stage redirect process via a Cloudflare Worker:

1. **Stage 1**: When a user clicks a link in an in-app browser, the link points to our Cloudflare Worker with `stage=1`. The worker detects the in-app browser and uses various techniques to break out to the device's native browser.

2. **Stage 2**: Once in the native browser, the same worker is called again but with `stage=2`. At this point, the worker redirects to the actual target URL, ensuring it loads properly in the native browser.

## Setup Instructions

### 1. Deploy the Cloudflare Worker

1. Sign up for a [Cloudflare Workers](https://workers.cloudflare.com/) account if you don't have one
2. Create a new Worker
3. Copy the contents of `cloudflare-worker.js` into your Worker
4. Deploy the Worker and note the URL (e.g., `https://smart-redirect.your-username.workers.dev`)

### 2. Update the Link Generator

1. Open `index.html`
2. Replace the placeholder Cloudflare Worker URL with your actual Worker URL:
   ```javascript
   const cloudflareWorkerUrl = "https://smart-redirect.your-username.workers.dev";
   ```
3. Deploy your updated `index.html` to your hosting service

## Usage

1. Visit your deployed link generator page
2. Enter the URL you want to share
3. Copy the generated link
4. Share this link on social media or messaging apps

When users click this link in an in-app browser, it will:
- Break out to their device's native browser
- Properly load the intended URL in that browser

## Technical Details

The Cloudflare Worker uses several techniques to detect in-app browsers and break out of them:
- User-Agent detection for browser type identification
- Multiple redirection methods with timeouts
- Meta refresh tags as fallbacks
- HTTP headers to prevent framing
- Programmatic link clicking

## Troubleshooting

If links aren't opening properly:

1. **Check the Worker logs** in your Cloudflare dashboard
2. **Verify the target URL** is properly encoded
3. **Test on different devices and browsers** to identify patterns

## License

MIT License 