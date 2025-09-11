'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Heart,
  FileText,
  Image,
  Music,
  Filter,
  Grid3X3,
  List,
  ArrowLeft,
  Share2,
  Lock
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { TopNavbar } from '@/components/ui/Navbar'
import { Navbar } from '@/components/ui/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
// Mock fantasy service - replace with real implementation
const listEntries = async () => {
  return []
}
// Mock fantasy entry type - replace with real schema
interface FantasyEntry {
  id: string
  title: string
  content: string
  tags: string[]
  isPrivate: boolean
  createdAt: string
  updatedAt: string
}

export default function NewFantasyPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [entries, setEntries] = useState<FantasyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<FantasyEntry | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'shared' | 'private'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'moodboard' | 'audio'>('all')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'moodboard' | 'audio',
    tags: [] as string[],
    comfortLevel: 3,
    shareStatus: 'hidden' as 'hidden' | 'tease' | 'reveal'
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && !authLoading) {
      loadEntries()
    }
  }, [user, authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const loadEntries = async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await listEntries(user.id)
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading fantasy entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEntry = async () => {
    if (!user || !formData.title.trim() || !formData.content.trim()) return

    setSaving(true)
    try {
      // Create entry logic here
      setShowCreateModal(false)
      resetForm()
      await loadEntries()
    } catch (error) {
      console.error('Error creating fantasy entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEntry = async () => {
    if (!editingEntry || !formData.title.trim() || !formData.content.trim()) return

    setSaving(true)
    try {
      // Update entry logic here
      setEditingEntry(null)
      resetForm()
      await loadEntries()
    } catch (error) {
      console.error('Error updating fantasy entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this fantasy entry?')) return

    try {
      // Delete entry logic here
      await loadEntries()
    } catch (error) {
      console.error('Error deleting fantasy entry:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'text',
      tags: [],
      comfortLevel: 3,
      shareStatus: 'hidden'
    })
  }

  const openEditModal = (entry: FantasyEntry) => {
    setEditingEntry(entry)
    setFormData({
      title: entry.title,
      content: entry.content,
      type: entry.type,
      tags: entry.tags || [],
      comfortLevel: entry.comfortLevel || 3,
      shareStatus: entry.shareStatus || 'hidden'
    })
    setShowCreateModal(true)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4" />
      case 'moodboard':
        return <Image className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getShareStatusIcon = (status: string) => {
    switch (status) {
      case 'hidden':
        return <Lock className="h-4 w-4 text-muted-foreground" />
      case 'tease':
        return <Eye className="h-4 w-4 text-warning" />
      case 'reveal':
        return <Share2 className="h-4 w-4 text-success" />
      default:
        return <Lock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getShareStatusText = (status: string) => {
    switch (status) {
      case 'hidden':
        return 'Hidden'
      case 'tease':
        return 'Tease'
      case 'reveal':
        return 'Revealed'
      default:
        return 'Hidden'
    }
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'shared' && entry.shareStatus === 'hidden') return false
    if (filter === 'private' && entry.shareStatus !== 'hidden') return false
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false
    return true
  })

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta-start"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <TopNavbar 
        title="Fantasy Vault" 
        subtitle={`${entries.length} entries`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            <Button
              variant="cta"
              size="sm"
              onClick={() => {
                resetForm()
                setEditingEntry(null)
                setShowCreateModal(true)
              }}
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        }
        showNotifications={true}
        showThemeToggle={true}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter === 'all' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'shared' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setFilter('shared')}
              >
                <Share2 className="h-4 w-4" />
                Shared
              </Button>
              <Button
                variant={filter === 'private' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setFilter('private')}
              >
                <Lock className="h-4 w-4" />
                Private
              </Button>
              
              <div className="w-px h-6 bg-border mx-2"></div>
              
              <Button
                variant={typeFilter === 'all' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                All Types
              </Button>
              <Button
                variant={typeFilter === 'text' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setTypeFilter('text')}
              >
                <FileText className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant={typeFilter === 'moodboard' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setTypeFilter('moodboard')}
              >
                <Image className="h-4 w-4" />
                Moodboard
              </Button>
              <Button
                variant={typeFilter === 'audio' ? 'cta' : 'secondary'}
                size="sm"
                onClick={() => setTypeFilter('audio')}
              >
                <Music className="h-4 w-4" />
                Audio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries */}
        {filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No fantasy entries yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first fantasy entry to get started
              </p>
              <Button
                variant="cta"
                onClick={() => {
                  resetForm()
                  setEditingEntry(null)
                  setShowCreateModal(true)
                }}
              >
                <Plus className="h-4 w-4" />
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {entry.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {getTypeIcon(entry.type)}
                        <span className="capitalize">{entry.type}</span>
                        <span>•</span>
                        <span>{format(new Date(entry.createdAt), 'MMM d')}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {getShareStatusIcon(entry.shareStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground text-sm line-clamp-3 mb-4">
                    {entry.content}
                  </p>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {entry.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-accent-rose/10 text-accent-rose rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="px-2 py-1 bg-bg-elevated text-muted-foreground rounded-full text-xs">
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getShareStatusText(entry.shareStatus)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Comfort: {entry.comfortLevel}/5
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-error hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEntry ? 'Edit Fantasy Entry' : 'Create New Fantasy Entry'}
              </CardTitle>
              <CardDescription>
                Share your intimate thoughts and desires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your fantasy a title"
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type
                </label>
                <div className="flex gap-2">
                  {['text', 'moodboard', 'audio'].map((type) => (
                    <Button
                      key={type}
                      variant={formData.type === type ? 'cta' : 'secondary'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                    >
                      {getTypeIcon(type)}
                      <span className="capitalize ml-1">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Textarea
                label="Content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Describe your fantasy in detail..."
                rows={6}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Comfort Level: {formData.comfortLevel}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.comfortLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, comfortLevel: Number(e.target.value) }))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Share Status
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'hidden', label: 'Hidden', icon: <Lock className="h-4 w-4" /> },
                    { value: 'tease', label: 'Tease', icon: <Eye className="h-4 w-4" /> },
                    { value: 'reveal', label: 'Reveal', icon: <Share2 className="h-4 w-4" /> }
                  ].map((option) => (
                    <Button
                      key={option.value}
                      variant={formData.shareStatus === option.value ? 'cta' : 'secondary'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, shareStatus: option.value as any }))}
                    >
                      {option.icon}
                      <span className="ml-1">{option.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="cta"
                  onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}
                  loading={saving}
                  className="flex-1"
                >
                  {editingEntry ? 'Update Entry' : 'Create Entry'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Navbar />
    </div>
  )
}
