import { supabase } from './supabaseClient'

// Types for storage operations
export interface FileUpload {
  file: File
  path: string
  bucket?: string
}

export interface FileDownload {
  path: string
  bucket?: string
}

export interface FileDelete {
  path: string
  bucket?: string
}

export interface StorageFile {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, any>
}

// Storage functions
export const storage = {
  // Upload a file
  async upload(data: FileUpload): Promise<{ url: string | null; error: string | null }> {
    try {
      const bucket = data.bucket || 'default'
      const { data: uploadData, error } = await supabase.storage
        .from(bucket)
        .upload(data.path, data.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return { url: null, error: error.message }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return { url: urlData.publicUrl, error: null }
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Download a file
  async download(data: FileDownload): Promise<{ blob: Blob | null; error: string | null }> {
    try {
      const bucket = data.bucket || 'default'
      const { data: blob, error } = await supabase.storage
        .from(bucket)
        .download(data.path)

      if (error) {
        return { blob: null, error: error.message }
      }

      return { blob, error: null }
    } catch (error) {
      return { blob: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Delete a file
  async delete(data: FileDelete): Promise<{ error: string | null }> {
    try {
      const bucket = data.bucket || 'default'
      const { error } = await supabase.storage
        .from(bucket)
        .remove([data.path])

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // List files in a bucket
  async list(bucket: string = 'default', path: string = ''): Promise<{ files: StorageFile[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path)

      if (error) {
        return { files: null, error: error.message }
      }

      const files: StorageFile[] = data.map(item => ({
        name: item.name,
        id: item.id,
        updated_at: item.updated_at,
        created_at: item.created_at,
        last_accessed_at: item.last_accessed_at,
        metadata: item.metadata || {}
      }))

      return { files, error: null }
    } catch (error) {
      return { files: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get public URL for a file
  async getPublicUrl(path: string, bucket: string = 'default'): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return { url: data.publicUrl, error: null }
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Create a signed URL for private files
  async createSignedUrl(path: string, expiresIn: number = 3600, bucket: string = 'default'): Promise<{ url: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        return { url: null, error: error.message }
      }

      return { url: data.signedUrl, error: null }
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },



  // Move/rename a file
  async move(fromPath: string, toPath: string, bucket: string = 'default'): Promise<{ error: string | null }> {
    try {
      // Download the file
      const { blob, error: downloadError } = await this.download({ path: fromPath, bucket })
      if (downloadError) {
        return { error: downloadError }
      }

      if (!blob) {
        return { error: 'Failed to download file for moving' }
      }

      // Upload to new location
      const file = new File([blob], toPath.split('/').pop() || 'file', { type: blob.type })
      const { error: uploadError } = await this.upload({ file, path: toPath, bucket })
      if (uploadError) {
        return { error: uploadError }
      }

      // Delete from old location
      const { error: deleteError } = await this.delete({ path: fromPath, bucket })
      if (deleteError) {
        return { error: deleteError }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Copy a file
  async copy(fromPath: string, toPath: string, bucket: string = 'default'): Promise<{ error: string | null }> {
    try {
      // Download the file
      const { blob, error: downloadError } = await this.download({ path: fromPath, bucket })
      if (downloadError) {
        return { error: downloadError }
      }

      if (!blob) {
        return { error: 'Failed to download file for copying' }
      }

      // Upload to new location
      const file = new File([blob], toPath.split('/').pop() || 'file', { type: blob.type })
      const { error: uploadError } = await this.upload({ file, path: toPath, bucket })
      if (uploadError) {
        return { error: uploadError }
      }

      return { error: null }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Specialized storage functions for different file types
export const imageStorage = {
  // Upload an image with optimization
  async uploadImage(data: FileUpload, options: { resize?: { width: number; height: number } } = {}): Promise<{ url: string | null; error: string | null }> {
    try {
      // Validate file type
      if (!data.file.type.startsWith('image/')) {
        return { url: null, error: 'File must be an image' }
      }

      // Use the general upload function
      return await storage.upload(data)
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },

  // Get image with specific dimensions
  async getImageUrl(path: string, width?: number, height?: number, bucket: string = 'default'): Promise<{ url: string | null; error: string | null }> {
    try {
      const { url, error } = await storage.getPublicUrl(path, bucket)
      if (error) {
        return { url: null, error }
      }

      // Add transformation parameters if dimensions are specified
      if (width || height) {
        const params = new URLSearchParams()
        if (width) params.append('width', width.toString())
        if (height) params.append('height', height.toString())
        return { url: `${url}?${params.toString()}`, error: null }
      }

      return { url, error: null }
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const documentStorage = {
  // Upload a document
  async uploadDocument(data: FileUpload): Promise<{ url: string | null; error: string | null }> {
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(data.file.type)) {
        return { url: null, error: 'File type not supported' }
      }

      return await storage.upload(data)
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

export const audioStorage = {
  // Upload audio file
  async uploadAudio(data: FileUpload): Promise<{ url: string | null; error: string | null }> {
    try {
      // Validate file type
      if (!data.file.type.startsWith('audio/')) {
        return { url: null, error: 'File must be an audio file' }
      }

      return await storage.upload(data)
    } catch (error) {
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}