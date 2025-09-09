'use client'

import { useState } from 'react'
import { Heart, Shuffle, Check } from 'lucide-react'
import { chooseTodayCard } from '@/features/intimacy/actions'
import { 
  getCategoryDisplayName, 
  getDifficultyDisplayName,
  hasConsentRequirement,
  getConsentMessage
} from '@/features/intimacy/selectors'
import type { IntimacyCard } from '@/features/intimacy/schemas'

interface TodayCardSelectorProps {
  suggestedCard: IntimacyCard | null
}

export default function TodayCardSelector({ suggestedCard }: TodayCardSelectorProps) {
  const [selectedCard, setSelectedCard] = useState<IntimacyCard | null>(suggestedCard)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSelectCard = async () => {
    if (!selectedCard) return

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append('selectedCardId', selectedCard.id)

    const result = await chooseTodayCard(formData)
    
    if (result.success) {
      setShowSuccess(true)
      setTimeout(() => {
        window.location.reload() // Refresh to show the selected card
      }, 1500)
    }
    
    setIsSubmitting(false)
  }

  const handleShuffle = () => {
    // For now, just reload the page to get a new suggested card
    // In a real implementation, you'd call the service to get a new card
    window.location.reload()
  }

  if (showSuccess) {
    return (
      <div className="elevated p-6 rounded-xl text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Card Selected!</h3>
        <p className="text-muted text-sm">
          Your connection card for today has been saved. You can now add a reflection or share with your partner.
        </p>
      </div>
    )
  }

  if (!selectedCard) {
    return (
      <div className="elevated p-6 rounded-xl text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
          <Heart size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Cards Available</h3>
        <p className="text-muted text-sm mb-4">
          There are no intimacy cards available at the moment. Please try again later.
        </p>
        <button
          onClick={handleShuffle}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Shuffle size={16} />
          <span>Try Again</span>
        </button>
      </div>
    )
  }

  return (
    <div className="elevated p-6 rounded-xl">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">
            {getCategoryDisplayName(selectedCard.category)}
          </span>
          <span className="text-xs text-muted">
            {getDifficultyDisplayName(selectedCard.difficulty)}
          </span>
        </div>
        <button
          onClick={handleShuffle}
          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
        >
          <Shuffle size={14} />
          <span>Shuffle</span>
        </button>
      </div>

      <div className="mb-4">
        <p className="text-foreground text-lg leading-relaxed mb-3">
          {selectedCard.text}
        </p>
        
        {hasConsentRequirement(selectedCard) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-amber-700 dark:text-amber-300 text-sm font-medium">
              💡 {getConsentMessage(selectedCard)}
            </p>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSelectCard}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Selecting...</span>
            </>
          ) : (
            <>
              <Heart size={16} />
              <span>Choose This Card</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="text-help text-xs">
          This card will be your focus for today. You can add reflections and share with your partner.
        </p>
      </div>
    </div>
  )
}
