import { test, expect } from '@playwright/test'

test.describe('Privacy Settings', () => {
  test.beforeEach(async ({ page }) => {
    // First, login with the test user
    await page.goto('/auth/login')
    
    // Fill in login form
    await page.fill('input[name="email"]', 'confirmeduser@gmail.com')
    await page.fill('input[name="password"]', 'testpassword123')
    
    // Submit login form
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
    
    // Now navigate to privacy settings page
    await page.goto('/settings/privacy')
  })

  test('should load privacy settings page', async ({ page }) => {
    await expect(page).toHaveTitle(/Privacy Settings/)
    await expect(page.locator('h1')).toContainText('Privacy Settings')
  })

  test('should display all privacy setting toggles', async ({ page }) => {
    // Check that all privacy settings are displayed
    const expectedSettings = [
      'Share with Partner',
      'Share Cycle Phase',
      'Share Mood Data',
      'Share Fantasy Vault',
      'Share Intimacy Deck',
    ]

    for (const setting of expectedSettings) {
      await expect(page.locator(`label:has-text("${setting}")`)).toBeVisible()
    }
  })

  test('should toggle privacy settings and persist changes', async ({ page }) => {
    // Wait for the form to load
    await page.waitForSelector('input[type="checkbox"]')

    // Get initial state of first checkbox
    const firstCheckbox = page.locator('input[type="checkbox"]').first()
    const initialChecked = await firstCheckbox.isChecked()

    // Toggle the first setting
    await firstCheckbox.click()

    // Wait for success message
    await expect(page.locator('text=Privacy settings updated successfully')).toBeVisible()

    // Reload the page
    await page.reload()

    // Wait for the form to load again
    await page.waitForSelector('input[type="checkbox"]')

    // Check that the setting persisted
    const firstCheckboxAfterReload = page.locator('input[type="checkbox"]').first()
    const checkedAfterReload = await firstCheckboxAfterReload.isChecked()
    
    expect(checkedAfterReload).toBe(!initialChecked)
  })

  test('should show success message when settings are updated', async ({ page }) => {
    // Wait for the form to load
    await page.waitForSelector('input[type="checkbox"]')

    // Toggle a setting
    await page.locator('input[type="checkbox"]').first().click()

    // Check for success message
    await expect(page.locator('text=Privacy settings updated successfully')).toBeVisible()
  })

  test('should reset settings to defaults', async ({ page }) => {
    // Wait for the form to load
    await page.waitForSelector('input[type="checkbox"]')

    // Toggle some settings
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click()
    }

    // Wait for updates to complete
    await page.waitForTimeout(1000)

    // Click reset button
    await page.locator('button:has-text("Reset to Defaults")').click()

    // Wait for success message
    await expect(page.locator('text=Privacy settings reset to defaults')).toBeVisible()

    // Reload the page
    await page.reload()

    // Wait for the form to load again
    await page.waitForSelector('input[type="checkbox"]')

    // Check that all settings are unchecked (defaults)
    const checkboxesAfterReset = page.locator('input[type="checkbox"]')
    const countAfterReset = await checkboxesAfterReset.count()
    
    for (let i = 0; i < countAfterReset; i++) {
      await expect(checkboxesAfterReset.nth(i)).not.toBeChecked()
    }
  })

  test('should show error message when update fails', async ({ page }) => {
    // Mock a failed API response
    await page.route('**/api/user', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    // Wait for the form to load
    await page.waitForSelector('input[type="checkbox"]')

    // Try to toggle a setting
    await page.locator('input[type="checkbox"]').first().click()

    // Check for error message
    await expect(page.locator('text=Failed to update privacy settings')).toBeVisible()
  })

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Wait for the form to load
    await page.waitForSelector('input[type="checkbox"]')

    // Tab through the form
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should work in dark mode', async ({ page }) => {
    // Toggle dark mode (assuming there's a theme toggle)
    // This might need to be adjusted based on your theme implementation
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
    })

    // Wait for the form to load
    await page.waitForSelector('input[type="checkbox"]')

    // Check that the form is still visible and functional
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible()

    // Toggle a setting to ensure functionality works
    await page.locator('input[type="checkbox"]').first().click()
    await expect(page.locator('text=Privacy settings updated successfully')).toBeVisible()
  })
})

