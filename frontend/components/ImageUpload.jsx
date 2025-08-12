'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ImageUpload({ 
  images = [], 
  onImagesChange, 
  maxImages = 10, 
  maxFileSize = 5, // MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (files) => {
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    const newImages = []

    try {
      for (const file of files) {
        // Validate file type
        if (!acceptedTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported image type`)
          continue
        }

        // Validate file size
        if (file.size > maxFileSize * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is ${maxFileSize}MB`)
          continue
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        
        // Add to new images array
        newImages.push({
          file,
          preview: previewUrl,
          name: file.name,
          size: file.size,
          type: file.type,
          uploading: true
        })
      }

      // Update parent component
      onImagesChange([...images, ...newImages])

      // Upload each image to Cloudinary
      for (let i = 0; i < newImages.length; i++) {
        const imageData = newImages[i]
        
        try {
          const formData = new FormData()
          formData.append('image', imageData.file)

          const response = await fetch('/api/upload/single', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`)
          }

          const result = await response.json()
          
          // Update the image with Cloudinary data
          const updatedImages = [...images, ...newImages]
          updatedImages[images.length + i] = {
            ...imageData,
            uploading: false,
            url: result.image.url,
            publicId: result.image.public_id,
            cloudinaryData: result.image
          }
          
          onImagesChange(updatedImages)
          toast.success(`${imageData.name} uploaded successfully`)
          
        } catch (error) {
          console.error('Upload error:', error)
          toast.error(`Failed to upload ${imageData.name}: ${error.message}`)
          
          // Remove failed upload from images
          const updatedImages = [...images, ...newImages]
          updatedImages.splice(images.length + i, 1)
          onImagesChange(updatedImages)
        }
      }

    } catch (error) {
      console.error('File processing error:', error)
      toast.error('Error processing files')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(Array.from(e.target.files))
    }
  }

  const removeImage = (index) => {
    const updatedImages = images.filter((_, i) => i !== index)
    onImagesChange(updatedImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className={`mx-auto h-12 w-12 ${
            dragActive ? 'text-green-500' : 'text-gray-400'
          }`} />
          <div className="text-sm">
            <p className="text-gray-600">
              <button
                type="button"
                onClick={openFileDialog}
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Click to upload
              </button>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxFileSize}MB
            </p>
            <p className="text-xs text-gray-500">
              Maximum {maxImages} images
            </p>
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                {image.uploading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Uploading...</p>
                    </div>
                  </div>
                ) : image.preview ? (
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                ) : image.url ? (
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Image Info */}
              <div className="mt-2 text-xs text-gray-600">
                <p className="truncate font-medium">{image.name}</p>
                <p className="text-gray-500">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="text-center text-sm text-gray-600">
          <div className="animate-pulse">Processing images...</div>
        </div>
      )}
    </div>
  )
}
