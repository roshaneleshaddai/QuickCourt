# Google Maps API Setup Guide

## Current Issue

The Google Maps component is stuck in loading state because the required API key is missing.

## Quick Fix

### 1. Create Environment File

Create a `.env.local` file in the frontend directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps JavaScript API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the generated API key

### 3. Restart Development Server

```bash
npm run dev
```

## Alternative: Disable Maps Temporarily

If you don't want to set up Google Maps right now, you can comment out the map component in the facility detail page:

```jsx
{
  /* Location Map */
}
{
  /* 
<div>
  <h4 className="font-medium text-gray-900 mb-3">Location Map</h4>
  <GoogleMap 
    coordinates={facility.location}
    facilityName={facility.name}
    address={facility.address}
  />
</div>
*/
}
```

## Debug Information

The component now logs API key information to the console. Check your browser's developer console to see:

- Whether the API key is detected
- The length of the key
- Any configuration issues

## Expected Behavior

After setup, you should see:
✅ Interactive Google Map
✅ Facility marker
✅ Clickable info window
✅ Proper zoom controls

Instead of:
❌ "Google Maps API key not configured" message
❌ Infinite loading state
