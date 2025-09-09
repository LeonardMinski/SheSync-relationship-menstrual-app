/**
 * Partner Intimacy Page - Read-only view for partner to see shared intimacy sessions
 * 
 * Features:
 * - View shared intimacy cards from partner
 * - Read-only access to partner's daily selections
 * - Supportive messaging and encouragement
 * - Partner connection status
 * - Privacy-focused design (only shows shared content)
 * 
 * Route: /partner/intimacy
 */
import PartnerIntimacy from './_components/PartnerIntimacy/PartnerIntimacy';

export default function PartnerIntimacyPage() {
  return <PartnerIntimacy />;
}
