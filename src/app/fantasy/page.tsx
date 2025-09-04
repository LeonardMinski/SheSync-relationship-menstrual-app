'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
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
  Filter
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FantasyEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getPhaseEmoji } from '@/lib/mockData';

const FantasyVault = () => {
  const { state, addFantasyEntry, updateFantasyEntry } = useApp();
  const { user, fantasyEntries, currentPhase, isLoading } = state;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FantasyEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'shared' | 'private'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'moodboard' | 'audio'>('all');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'moodboard' | 'audio',
    tags: [] as string[],
    isSharedWithPartner: false,
    mood: 5,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your fantasy vault..." />
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'text',
      tags: [],
      isSharedWithPartner: false,
      mood: 5,
    });
    setEditingEntry(null);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingEntry) {
      // Update existing entry
      updateFantasyEntry(editingEntry.id, {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        tags: formData.tags,
        isSharedWithPartner: formData.isSharedWithPartner,
        mood: formData.mood,
      });
    } else {
      // Create new entry
      const newEntry: FantasyEntry = {
        id: uuidv4(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        tags: formData.tags,
        isSharedWithPartner: formData.isSharedWithPartner,
        createdAt: new Date(),
        updatedAt: new Date(),
        mood: formData.mood,
        phase: currentPhase,
      };
      addFantasyEntry(newEntry);
    }

    resetForm();
    setShowCreateModal(false);
  };

  const handleEdit = (entry: FantasyEntry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      content: entry.content,
      type: entry.type,
      tags: entry.tags,
      isSharedWithPartner: entry.isSharedWithPartner,
      mood: entry.mood || 5,
    });
    setShowCreateModal(true);
  };

  const toggleShare = (entry: FantasyEntry) => {
    updateFantasyEntry(entry.id, {
      isSharedWithPartner: !entry.isSharedWithPartner
    });
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag.trim()]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const filteredEntries = fantasyEntries.filter(entry => {
    if (filter === 'shared' && !entry.isSharedWithPartner) return false;
    if (filter === 'private' && entry.isSharedWithPartner) return false;
    if (typeFilter !== 'all' && entry.type !== typeFilter) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText;
      case 'moodboard': return Image;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'text-blue-500';
      case 'moodboard': return 'text-purple-500';
      case 'audio': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const suggestedTags = [
    'romantic', 'adventure', 'spa day', 'travel', 'intimate', 'playful', 
    'relaxing', 'exciting', 'dreamy', 'passionate', 'cozy', 'spontaneous'
  ];

  return (
    <div className="min-h-screen pb-20">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white dark:text-white">Fantasy Vault</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Your private space for dreams, desires, and intimate thoughts
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              <Plus size={20} />
              <span>New Entry</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            </div>
            
            {/* Privacy Filter */}
            {['all', 'private', 'shared'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

            {/* Type Filter */}
            {['all', 'text', 'moodboard', 'audio'].map((typeOption) => (
              <button
                key={typeOption}
                onClick={() => setTypeFilter(typeOption as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  typeFilter === typeOption
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Entries Grid */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white dark:text-white mb-2">
              No entries yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start creating your fantasy vault by adding your first entry.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all"
            >
              Create Your First Entry
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEntries.map((entry) => {
              const TypeIcon = getTypeIcon(entry.type);
              
              return (
                <div
                  key={entry.id}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-rose-200 dark:border-gray-700 hover:shadow-lg transition-all"
                >
                  {/* Entry Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <TypeIcon size={20} className={getTypeColor(entry.type)} />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {entry.type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleShare(entry)}
                        className={`p-2 rounded-lg transition-colors ${
                          entry.isSharedWithPartner
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                        title={entry.isSharedWithPartner ? 'Shared with partner' : 'Private'}
                      >
                        {entry.isSharedWithPartner ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Entry Content */}
                  <h3 className="text-lg font-semibold text-white dark:text-white mb-2">
                    {entry.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {entry.content}
                  </p>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {entry.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                          +{entry.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Entry Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      {entry.phase && (
                        <span>{getPhaseEmoji(entry.phase)}</span>
                      )}
                      {entry.mood && (
                        <div className="flex items-center space-x-1">
                          <Heart size={12} />
                          <span>{entry.mood}/10</span>
                        </div>
                      )}
                    </div>
                    <span>{format(entry.createdAt, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white dark:text-white mb-6">
              {editingEntry ? 'Edit Entry' : 'Create New Entry'}
            </h3>
            
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Give your entry a title..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white dark:text-white"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <div className="flex space-x-3">
                  {['text', 'moodboard', 'audio'].map((type) => {
                    const TypeIcon = getTypeIcon(type);
                    return (
                      <button
                        key={type}
                        onClick={() => setFormData({...formData, type: type as any})}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                          formData.type === type
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <TypeIcon size={16} />
                        <span className="capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Share your thoughts, dreams, or fantasies..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white dark:text-white"
                  rows={6}
                />
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mood (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.mood}
                  onChange={(e) => setFormData({...formData, mood: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  {formData.mood}/10
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                
                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested Tags */}
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Share Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <div className="font-medium text-white dark:text-white">Share with Partner</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Allow your partner to see this entry
                  </div>
                </div>
                <button
                  onClick={() => setFormData({...formData, isSharedWithPartner: !formData.isSharedWithPartner})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isSharedWithPartner ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isSharedWithPartner ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.title.trim() || !formData.content.trim()}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50"
              >
                {editingEntry ? 'Update' : 'Create'} Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FantasyVault;