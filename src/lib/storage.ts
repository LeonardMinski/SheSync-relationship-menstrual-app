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

// Data persistence functions for app state
import { User, CycleData, AICoachMessage, IntimacyCard, FantasyEntry, Notification } from '@/types'

const getBrowserStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null
  if (typeof window.localStorage?.getItem !== 'function') return null
  if (typeof window.localStorage?.setItem !== 'function') return null
  if (typeof window.localStorage?.removeItem !== 'function') return null
  return window.localStorage
}

// User management
export const getUser = (): User | null => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return null
    const userData = storage.getItem('sheSync_user')
    if (!userData) return null
    
    const user = JSON.parse(userData)
    // Convert date strings back to Date objects
    user.createdAt = new Date(user.createdAt)
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export const saveUser = (user: User): void => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return
    storage.setItem('sheSync_user', JSON.stringify(user))
  } catch (error) {
    console.error('Error saving user:', error)
  }
}

export const saveUserProfileImage = (userId: string, imageUrl: string): void => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return
    const existingUser = getUser()
    if (existingUser) {
      const updatedUser = { ...existingUser, profileImageUrl: imageUrl }
      saveUser(updatedUser)
    }
    // Also save separately for quick access
    storage.setItem(`sheSync_profileImage_${userId}`, imageUrl)
  } catch (error) {
    console.error('Error saving user profile image:', error)
  }
}

export const getUserProfileImage = (userId: string): string | null => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return null
    // First try to get from user object
    const user = getUser()
    if (user && user.profileImageUrl) {
      return user.profileImageUrl
    }
    // Fallback to separate storage
    return storage.getItem(`sheSync_profileImage_${userId}`)
  } catch (error) {
    console.error('Error getting user profile image:', error)
    return null
  }
}

// Cycle data management
export const getCycleData = (): CycleData[] => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return []
    const cycleData = storage.getItem('sheSync_cycleData')
    if (!cycleData) return []
    
    const data = JSON.parse(cycleData)
    // Convert date strings back to Date objects
    return data.map((entry: any) => ({
      ...entry,
      date: new Date(entry.date)
    }))
  } catch (error) {
    console.error('Error getting cycle data:', error)
    return []
  }
}

export const saveCycleData = (cycleData: CycleData[]): void => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return
    storage.setItem('sheSync_cycleData', JSON.stringify(cycleData))
  } catch (error) {
    console.error('Error saving cycle data:', error)
  }
}

// AI messages management
export const getAIMessages = (): AICoachMessage[] => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return []
    const messages = storage.getItem('sheSync_aiMessages')
    if (!messages) return []
    
    const data = JSON.parse(messages)
    // Convert date strings back to Date objects
    return data.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp)
    }))
  } catch (error) {
    console.error('Error getting AI messages:', error)
    return []
  }
}

// Intimacy cards management
export const getIntimacyCards = (): IntimacyCard[] => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return []
    const cards = storage.getItem('sheSync_intimacyCards')
    if (!cards) return []
    
    return JSON.parse(cards)
  } catch (error) {
    console.error('Error getting intimacy cards:', error)
    return []
  }
}

// Fantasy entries management
export const getFantasyEntries = (): FantasyEntry[] => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return []
    const entries = storage.getItem('sheSync_fantasyEntries')
    if (!entries) return []
    
    const data = JSON.parse(entries)
    // Convert date strings back to Date objects
    return data.map((entry: any) => ({
      ...entry,
      createdAt: new Date(entry.createdAt),
      updatedAt: new Date(entry.updatedAt)
    }))
  } catch (error) {
    console.error('Error getting fantasy entries:', error)
    return []
  }
}

export const updateFantasyEntry = (entryId: string, updates: Partial<FantasyEntry>): void => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return
    const entries = getFantasyEntries()
    const updatedEntries = entries.map(entry => 
      entry.id === entryId 
        ? { ...entry, ...updates, updatedAt: new Date() }
        : entry
    )
    storage.setItem('sheSync_fantasyEntries', JSON.stringify(updatedEntries))
  } catch (error) {
    console.error('Error updating fantasy entry:', error)
  }
}

// Notifications management
export const getNotifications = (): Notification[] => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return []
    const notifications = storage.getItem('sheSync_notifications')
    if (!notifications) return []
    
    const data = JSON.parse(notifications)
    // Convert date strings back to Date objects
    return data.map((notification: any) => ({
      ...notification,
      createdAt: new Date(notification.createdAt)
    }))
  } catch (error) {
    console.error('Error getting notifications:', error)
    return []
  }
}

// Theme management
export const getTheme = (): 'light' | 'dark' => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return 'light'
    const theme = storage.getItem('sheSync_theme')
    return theme === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.error('Error getting theme:', error)
    return 'light'
  }
}

// Profile image functions
export const uploadProfileImage = async (file: File, userId: string): Promise<{ url: string | null; error: string | null }> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/profile.${fileExt}`
    const filePath = `profiles/${fileName}`

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file
      })

    if (error) {
      console.error('Error uploading profile image:', error)
      return { url: null, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Profile image upload failed:', error)
    return { url: null, error: error instanceof Error ? error.message : 'Upload failed' }
  }
}

export const deleteProfileImage = async (userId: string): Promise<{ error: string | null }> => {
  try {
    // Try to delete common image extensions
    const possibleFiles = [
      `profiles/${userId}/profile.jpg`,
      `profiles/${userId}/profile.png`, 
      `profiles/${userId}/profile.jpeg`,
      `profiles/${userId}/profile.webp`
    ]

    const { error } = await supabase.storage
      .from('avatars')
      .remove(possibleFiles)

    if (error) {
      console.error('Error deleting profile image:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Profile image deletion failed:', error)
    return { error: error instanceof Error ? error.message : 'Deletion failed' }
  }
}

export const saveTheme = (theme: 'light' | 'dark'): void => {
  try {
    const storage = getBrowserStorage()
    if (!storage) return
    storage.setItem('sheSync_theme', theme)
  } catch (error) {
    console.error('Error saving theme:', error)
  }
}
