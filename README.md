# JustOpen - Smart Link Redirector

A solution for breaking out of in-app browsers (like Instagram, Facebook, etc.) and ensuring links open properly in the device's native browser, not in native apps.

## The Problem

When users click links in social media apps like Instagram or Facebook, they often face two issues:

1. Links open in the app's built-in browser instead of the device's native browser
2. When redirected to the native browser, links sometimes:
   - Show a blank/black page with no content
   - Open in a native app (YouTube app, Twitter app, etc.) instead of the browser

This project addresses both issues by:
- Breaking out of in-app browsers to the device's native browser
- Ensuring the URL properly loads in the browser, not in a native app

## How It Works

The solution uses a two-stage redirect process via a Cloudflare Worker:

1. **Stage 1**: When a user clicks a link in an in-app browser, the link points to our Cloudflare Worker with `stage=1`. The worker detects the in-app browser and uses various techniques to break out to the device's native browser.

2. **Stage 2**: Once in the native browser, the same worker is called again but with `stage=2`. At this point, the worker:
   - Modifies URLs if needed to force web versions (for YouTube, Twitter, etc.)
   - Uses special techniques to ensure links open in the browser, not in native apps
   - Redirects to the actual target URL

## Key Features

- **In-App Browser Detection**: Identifies when links are opened in Instagram, Facebook, Twitter, etc.
- **Smart Breakout**: Uses multiple techniques to escape the in-app browser
- **Force Web Mode**: Prevents links from opening in native apps by modifying URLs and using browser-specific techniques
- **Platform-Specific Handling**: Different approaches for iOS and Android devices

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
3. Check/uncheck "Force web version" option as needed:
   - **Checked** (recommended): Prevents opening in native apps like YouTube, Twitter, etc.
   - **Unchecked**: Allows native app opening if the user has the app installed
4. Copy the generated link
5. Share this link on social media or messaging apps

When users click this link in an in-app browser, it will:
- Break out to their device's native browser
- Properly load the intended URL in that browser (not in a native app)

## Supported Services for Force Web Mode

The worker includes special handling for these services to prevent them from opening in native apps:
- YouTube
- Twitter/X
- Instagram
- Facebook
- TikTok
- Reddit

## Technical Details

The Cloudflare Worker uses several techniques to ensure links open in browsers, not apps:
- URL parameter modifications to force web versions
- Delayed redirects to bypass app intent handling
- window.open() with _blank target
- Programmatic link clicking with target="_blank"
- Removal of direct 302 redirects that can trigger app intents

## Troubleshooting

If links aren't opening properly:

1. **Check the Worker logs** in your Cloudflare dashboard
2. **Verify the target URL** is properly encoded
3. **Test with "Force web version" both checked and unchecked**
4. **Test on different devices and browsers** to identify patterns

## License

MIT License 