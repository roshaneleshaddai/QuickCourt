// Cloudinary Configuration Example
// Copy this file to cloudinary.js and replace with your actual credentials

const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your_cloud_name",
  api_key: process.env.CLOUDINARY_API_KEY || "your_api_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "your_api_secret",
});

module.exports = cloudinary;

// To use this:
// 1. Sign up at https://cloudinary.com/
// 2. Get your credentials from the Dashboard
// 3. Set environment variables or replace the values above
// 4. Copy this file to cloudinary.js
