'use server'

import { revalidatePath } from 'next/cache'
import { createEntry, updateEntry, deleteEntry, listEntries } from './services'
import { CreateFantasyActionSchema, UpdateFantasyActionSchema, DeleteFantasyActionSchema } from './schemas'

// =====================================================
// SERVER ACTIONS
// =====================================================

export async function createFantasyEntry(formData: FormData) {
  try {
    const userId = formData.get('userId') as string
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      isPrivate: formData.get('isPrivate') === 'true',
      mood: formData.get('mood') ? parseInt(formData.get('mood') as string) : undefined,
      phase: formData.get('phase') as string || undefined
    }

    const validatedData = CreateFantasyActionSchema.parse(rawData)
    const result = await createEntry(userId, validatedData)

    if (!result) {
      return { success: false, error: 'Failed to create fantasy entry' }
    }

    revalidatePath('/fantasy')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating fantasy entry:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function updateFantasyEntry(formData: FormData) {
  try {
    const userId = formData.get('userId') as string
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const rawData = {
      id: formData.get('id') as string,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      tags: JSON.parse(formData.get('tags') as string || '[]'),
      isPrivate: formData.get('isPrivate') === 'true',
      mood: formData.get('mood') ? parseInt(formData.get('mood') as string) : undefined,
      phase: formData.get('phase') as string || undefined
    }

    const validatedData = UpdateFantasyActionSchema.parse(rawData)
    const result = await updateEntry(userId, validatedData.id, validatedData)

    if (!result) {
      return { success: false, error: 'Failed to update fantasy entry' }
    }

    revalidatePath('/fantasy')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating fantasy entry:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function deleteFantasyEntry(formData: FormData) {
  try {
    const userId = formData.get('userId') as string
    if (!userId) {
      return { success: false, error: 'User ID is required' }
    }

    const rawData = {
      id: formData.get('id') as string
    }

    const validatedData = DeleteFantasyActionSchema.parse(rawData)
    const success = await deleteEntry(userId, validatedData.id)

    if (!success) {
      return { success: false, error: 'Failed to delete fantasy entry' }
    }

    revalidatePath('/fantasy')
    return { success: true }
  } catch (error) {
    console.error('Error deleting fantasy entry:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error occurred' }
  }
}

export async function getFantasyEntries(userId: string) {
  try {
    const entries = await listEntries(userId)
    return { success: true, data: entries }
  } catch (error) {
    console.error('Error fetching fantasy entries:', error)
    return { success: false, error: 'Failed to fetch fantasy entries' }
  }
}

