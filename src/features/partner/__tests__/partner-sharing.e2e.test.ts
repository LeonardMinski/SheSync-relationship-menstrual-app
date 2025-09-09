import { test, expect } from '@playwright/test'

test.describe('Partner Sharing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/auth/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('should show partner portal when partner shares data', async ({ page }) => {
    // Navigate to partner portal
    await page.goto('/partner')
    
    // Should show partner portal with shared data
    await expect(page.locator('h1')).toContainText('Partner Portal')
    
    // Should show today at a glance section
    await expect(page.locator('[data-testid="today-at-glance"]')).toBeVisible()
    
    // Should show cycle phase if shared
    await expect(page.locator('[data-testid="cycle-phase"]')).toBeVisible()
    
    // Should show mood if shared
    await expect(page.locator('[data-testid="mood"]')).toBeVisible()
    
    // Should show intimacy card if shared
    await expect(page.locator('[data-testid="intimacy-card"]')).toBeVisible()
    
    // Should show fantasy teaser if shared
    await expect(page.locator('[data-testid="fantasy-teaser"]')).toBeVisible()
  })

  test('should hide data when partner unshares', async ({ page }) => {
    // Navigate to partner portal
    await page.goto('/partner')
    
    // Initially should show shared data
    await expect(page.locator('[data-testid="cycle-phase"]')).toBeVisible()
    
    // Simulate partner unsharing cycle data
    await page.evaluate(() => {
      // Mock API response with unshared data
      window.fetch = async () => ({
        ok: true,
        json: async () => ({
          data: {
            sharedData: {
              partnerName: 'Test Partner',
              privacySettings: {
                shareWithPartner: true,
                shareCyclePhase: false, // Unshared
                shareMood: false, // Unshared
                shareFantasyVault: false, // Unshared
                shareIntimacyDeck: false // Unshared
              },
              recentActivity: []
            },
            partnerLink: {
              id: 'link-1',
              user_id: 'user-1',
              partner_user_id: 'partner-1',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          }
        })
      })
    })
    
    // Refresh the page to get updated data
    await page.reload()
    
    // Should hide cycle phase
    await expect(page.locator('[data-testid="cycle-phase"]')).not.toBeVisible()
    
    // Should hide mood
    await expect(page.locator('[data-testid="mood"]')).not.toBeVisible()
    
    // Should hide intimacy card
    await expect(page.locator('[data-testid="intimacy-card"]')).not.toBeVisible()
    
    // Should hide fantasy teaser
    await expect(page.locator('[data-testid="fantasy-teaser"]')).not.toBeVisible()
    
    // Should show privacy notice
    await expect(page.locator('[data-testid="privacy-notice"]')).toBeVisible()
  })

  test('should show no shared data message when partner disables sharing', async ({ page }) => {
    // Mock API response with disabled sharing
    await page.evaluate(() => {
      window.fetch = async () => ({
        ok: true,
        json: async () => ({
          data: {
            sharedData: {
              partnerName: 'Test Partner',
              privacySettings: {
                shareWithPartner: false, // Disabled
                shareCyclePhase: false,
                shareMood: false,
                shareFantasyVault: false,
                shareIntimacyDeck: false
              },
              recentActivity: []
            },
            partnerLink: {
              id: 'link-1',
              user_id: 'user-1',
              partner_user_id: 'partner-1',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          }
        })
      })
    })
    
    await page.goto('/partner')
    
    // Should show no shared data message
    await expect(page.locator('[data-testid="no-shared-data"]')).toBeVisible()
    await expect(page.locator('text=No Shared Data Yet')).toBeVisible()
    await expect(page.locator('text=Your partner hasn\'t shared any data yet or has disabled sharing.')).toBeVisible()
  })

  test('should show no partner connected message when no partner link exists', async ({ page }) => {
    // Mock API response with no partner
    await page.evaluate(() => {
      window.fetch = async () => ({
        ok: true,
        json: async () => ({
          data: {
            sharedData: null,
            partnerLink: null
          }
        })
      })
    })
    
    await page.goto('/partner')
    
    // Should show no partner connected message
    await expect(page.locator('[data-testid="no-partner"]')).toBeVisible()
    await expect(page.locator('text=No Partner Connected')).toBeVisible()
    await expect(page.locator('text=Connect with your partner to start sharing your journey together.')).toBeVisible()
    await expect(page.locator('[data-testid="connect-partner-button"]')).toBeVisible()
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    await page.goto('/partner')
    
    // Click refresh button
    await page.click('[data-testid="refresh-button"]')
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Should eventually show updated data
    await expect(page.locator('[data-testid="today-at-glance"]')).toBeVisible()
  })

  test('should show recent activity when available', async ({ page }) => {
    // Mock API response with recent activity
    await page.evaluate(() => {
      window.fetch = async () => ({
        ok: true,
        json: async () => ({
          data: {
            sharedData: {
              partnerName: 'Test Partner',
              privacySettings: {
                shareWithPartner: true,
                shareCyclePhase: true,
                shareMood: true,
                shareFantasyVault: true,
                shareIntimacyDeck: true
              },
              recentActivity: [
                {
                  description: 'Logged ovulation phase with mood 8/10',
                  date: '2024-01-01',
                  type: 'cycle'
                },
                {
                  description: 'Completed talk connection card',
                  date: '2024-01-01',
                  type: 'intimacy'
                }
              ]
            },
            partnerLink: {
              id: 'link-1',
              user_id: 'user-1',
              partner_user_id: 'partner-1',
              status: 'active',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z'
            }
          }
        })
      })
    })
    
    await page.goto('/partner')
    
    // Should show recent activity section
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
    
    // Should show activity items
    await expect(page.locator('[data-testid="activity-item"]')).toHaveCount(2)
    await expect(page.locator('text=Logged ovulation phase with mood 8/10')).toBeVisible()
    await expect(page.locator('text=Completed talk connection card')).toBeVisible()
  })

  test('should show supportive actions section', async ({ page }) => {
    await page.goto('/partner')
    
    // Should show supportive actions
    await expect(page.locator('[data-testid="supportive-actions"]')).toBeVisible()
    await expect(page.locator('text=Supportive Actions')).toBeVisible()
    
    // Should show action items
    await expect(page.locator('text=Be present and attentive')).toBeVisible()
    await expect(page.locator('text=Ask thoughtful questions')).toBeVisible()
    await expect(page.locator('text=Respect boundaries')).toBeVisible()
  })
})
