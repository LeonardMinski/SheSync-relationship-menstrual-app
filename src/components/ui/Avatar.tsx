'use client'

import React, { useState, useRef } from 'react'
import { Upload, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
  onUpload?: (file: File) => void
  className?: string
}

export function Avatar({ 
  src, 
  alt = 'User avatar', 
  size = 'md', 
  editable = false, 
  onUpload,
  className 
}: AvatarProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onUpload) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setIsUploading(true)
    
    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImageSrc(previewUrl)
      
      // Call upload handler
      await onUpload(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload image. Please try again.')
      // Revert to original image
      setImageSrc(src)
    } finally {
      setIsUploading(false)
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'relative rounded-full bg-bg-muted flex items-center justify-center overflow-hidden',
          sizeClasses[size],
          editable && 'cursor-pointer hover:opacity-80 transition-opacity',
          className
        )}
        onClick={handleClick}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn('text-muted', iconSizes[size])} />
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            className="absolute -bottom-1 -right-1 w-6 h-6 bg-cta-start rounded-full flex items-center justify-center hover:bg-cta-end transition-colors"
            onClick={handleClick}
            disabled={isUploading}
          >
            <Camera className="w-3 h-3 text-white" />
          </button>
        </>
      )}
    </div>
  )
}
