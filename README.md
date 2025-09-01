# SheSync+ 🌸

**The ultimate cycle-powered wellbeing, connection & intimacy app — for women and their partners.**

A privacy-first relationship and wellness app focused on women's hormonal cycles, self-awareness, and deeper intimacy with partners.

![SheSync+ Preview](https://via.placeholder.com/800x400/ff6b9d/ffffff?text=SheSync%2B+App+Preview)

## ✨ Core Features

### 🌟 For Women

#### 1. **Cycle & Mood Tracking**
- AI-powered cycle phase predictions (menstrual, follicular, ovulation, luteal)
- Mood, energy, libido, and stress tracking
- Symptom logging with smart insights
- Calendar integration with visual cycle overview

#### 2. **Energy + Habit Planner**
- Cycle-aligned productivity recommendations
- Phase-specific wellness tips
- Smart habit prompts (hydration, nutrition, rest)
- Exercise recommendations based on hormonal fluctuations

#### 3. **Fantasy Vault & Moodboards**
- Private space for intimate thoughts and dreams
- Multiple entry types (text, moodboard, audio notes)
- Selective sharing with partner
- Mood and phase correlation tracking

#### 4. **AI Self-Coaching**
- Personalized insights based on cycle data
- Natural language Q&A interface
- Phase-specific wellness recommendations
- Relationship and communication guidance

### 🧑‍🤝‍🧑 For Partners

#### 1. **Partner Portal**
- Invite-only controlled access
- Phase awareness and support suggestions
- Craving alerts and wishlist hints
- Daily affirmations and support prompts

#### 2. **Shared Intimacy Deck**
- 100+ AI-curated conversation starters
- Categories: emotional, sensual, fantasy
- Shared answers and partner responses
- Progress tracking and completion stats

#### 3. **Fantasy & Connection Sync**
- Respectful connection ideas
- "Fantasy Reveals" - mutual discovery system
- Privacy-controlled sharing

## 🔒 Privacy & Security

- **Local-first data storage** with optional cloud backup
- **End-to-end encryption** for sensitive content
- **Granular privacy controls** - share what you want, when you want
- **No third-party tracking** or advertising
- **Data export** and **complete deletion** options
- **Partner access revocation** at any time

## 💎 Subscription Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | £0 | Basic tracker, 5 intimacy cards, simple mood logging |
| **Premium** | £15/mo | Full sync tracker, partner access, 100+ questions, AI coach |
| **VIP** | £39/mo | Everything + Fantasy Vault, custom rituals, priority support |
| **Lifetime** | £199 | All features forever + exclusive benefits |

## 🚀 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + TailwindCSS
- **State Management**: React Context + useReducer
- **Data Storage**: Local Storage with encrypted backup options
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Future Integrations**: 
  - Supabase (authentication & sync)
  - OpenAI API (AI coaching)
  - Stripe (payments)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd shesync-plus

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env.local` file:

```env
# Future API integrations
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 📱 App Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Cycle Tracker (Homepage)
│   ├── ai-coach/          # AI Coaching Interface
│   ├── intimacy/          # Intimacy Deck
│   ├── fantasy/           # Fantasy Vault
│   └── settings/          # User Settings
├── components/            # Reusable UI components
├── context/              # React Context providers
├── lib/                  # Utilities and helpers
│   ├── storage.ts        # Local storage management
│   └── mockData.ts       # Demo data
└── types/                # TypeScript definitions
```

## 🎨 Key Components

### Cycle Tracker
- Daily data logging with quick entry modal
- Visual calendar with cycle phases
- Mood, energy, and symptom tracking
- Personalized insights and recommendations

### AI Coach
- Natural language chat interface
- Context-aware responses based on cycle data
- Suggested conversation starters
- Real-time typing indicators

### Intimacy Deck
- Swipeable card interface
- Category filtering (emotional, sensual, fantasy)
- Answer sharing and partner responses
- Progress tracking and statistics

### Fantasy Vault
- Rich text entry creation and editing
- Tag-based organization
- Privacy controls and selective sharing
- Mood and phase correlation

### Settings & Privacy
- Granular privacy controls
- Subscription management
- Data export and deletion
- Partner invitation and management

## 🌈 Design System

- **Colors**: Rose to purple gradient theme
- **Typography**: Inter font family
- **Layout**: Responsive grid with mobile-first design
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: WCAG 2.1 AA compliant
- **Dark Mode**: Full dark/light theme support

## 🔮 Future Enhancements

- **Hormone-friendly recipes** synced to cycle phases
- **Soundscapes & meditation** with phase-specific content
- **Push notifications** for cycle milestones
- **Love language detection** via AI analysis
- **Wearable integrations** (temperature, sleep tracking)
- **Community features** with anonymous sharing
- **Telehealth integration** for professional support

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and code of conduct.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with love for women's wellness and relationship health
- Inspired by the need for privacy-first intimate technology
- Thank you to all the women who shared their stories and needs

---

**Made with 💝 for women and their partners**

*SheSync+ - Because your cycle is your superpower* ✨
