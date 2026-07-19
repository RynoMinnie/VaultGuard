# Generating Store Packages from Your PWA

Once your VaultGuard app is deployed to a public URL (e.g., https://yourvault.com), follow these steps to generate installable packages for app stores.

## Prerequisites
- Your app must be publicly accessible (deployed to a VPS, Railway, etc.)
- A modern web browser

## Generate Packages (Free, ~2 minutes)

1. Go to [PWABuilder](https://www.pwabuilder.com/) (a free tool by Microsoft)
2. Enter your app's public URL (e.g., `https://yourvault.com`)
3. Click "Start"
4. PWABuilder will analyze your app and show a score
5. Click "Package for stores" (or similar button)
6. Select the platforms you want:
   - **Android** → Downloads an `.aab` file for Google Play Store
   - **Windows** → Downloads an `.msix` file for Microsoft Store
7. Follow the platform-specific instructions below

## Google Play Store (Android)
1. Go to [Google Play Console](https://play.google.com/console) (one-time $25 registration fee)
2. Create a new app
3. Fill in the store listing (name, description, screenshots, etc.)
4. Under "App bundles", upload the `.aab` file from PWABuilder
5. Complete the content rating questionnaire
6. Submit for review (typically 1-3 days)

## Microsoft Store (Windows)
1. Go to [Partner Center](https://partner.microsoft.com/dashboard) (free)
2. Create a new app
3. Fill in the store listing
4. Upload the `.msix` file from PWABuilder
5. Submit for review (typically 1-5 days)

## Important Notes
- When you update your app, redeploy to your server. PWA users get updates automatically.
- For store packages, you'll need to regenerate and resubmit through PWABuilder + the store dashboard.
- The PWA route means you control the update cadence — no store approval needed for PWA users.
- Store packages are a convenience layer; the app still runs from your server.