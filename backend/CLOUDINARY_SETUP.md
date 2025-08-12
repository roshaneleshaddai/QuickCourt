# Cloudinary Setup Guide

## Prerequisites

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from the Dashboard

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Configuration

1. Copy `config/cloudinary.example.js` to `config/cloudinary.js`
2. Replace the placeholder values with your actual credentials
3. Or set the environment variables (recommended)

## Testing

1. Start the backend server: `npm start`
2. Check the console for Cloudinary configuration warnings
3. Test image upload through the frontend

## Troubleshooting

- If you see "Cloudinary credentials not found" warnings, check your environment variables
- Ensure the uploads directory exists (should be created automatically)
- Check that Cloudinary service is accessible from your network

## Features

- Single and multiple image uploads
- Automatic image optimization (800x600, auto quality)
- Temporary file cleanup
- Error handling and validation
- Support for JPEG, PNG, WebP, and GIF formats
- Maximum file size: 5MB per image
- Maximum images: 10 for facilities, 5 for courts
