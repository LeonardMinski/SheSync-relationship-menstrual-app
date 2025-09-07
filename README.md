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
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Testing**: Vitest + Playwright
- **Validation**: Zod schemas
- **Styling**: TailwindCSS with custom CSS variables
- **Deployment**: Vercel-ready
- **Integrations**: 
  - Supabase (authentication, database, real-time)
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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Integrations
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Database Setup

1. **Create Supabase Project**: Set up a new project at [supabase.com](https://supabase.com)
2. **Run Schema**: Execute the SQL files in the `database/` folder:
   ```bash
   # Apply the main schema
   psql -h your-db-host -U postgres -d postgres -f database/supabase-schema.sql
   
   # Apply intimacy feature schema
   psql -h your-db-host -U postgres -d postgres -f database/intimacy-schema.sql
   ```
3. **Seed Data**: Run the intimacy cards seed script:
   ```bash
   npm run seed:intimacy
   ```

## 📱 App Structure

```
src/
├── app/                           # Next.js App Router pages
│   ├── _components/              # Shared page components
│   │   └── LandingPage/          # Landing page component
│   ├── page.tsx                  # Landing page (Homepage)
│   ├── dashboard/                # Main dashboard
│   │   ├── _components/Dashboard/ # Dashboard component
│   │   └── page.tsx              # Dashboard route
│   ├── ai-coach/                 # AI Coaching Interface
│   │   ├── _components/AICoach/  # AI Coach component
│   │   └── page.tsx              # AI Coach route
│   ├── intimacy/                 # Intimacy Deck
│   │   ├── _components/          # Intimacy components
│   │   │   ├── BoundaryManager/  # Boundary management
│   │   │   ├── TodayCardSelector/ # Card selection
│   │   │   ├── ReflectionForm/   # Reflection input
│   │   │   └── ShareToggle/      # Sharing controls
│   │   └── page.tsx              # Intimacy route
│   ├── fantasy/                  # Fantasy Vault
│   │   ├── _components/FantasyPage/ # Fantasy component
│   │   └── page.tsx              # Fantasy route
│   ├── partner/intimacy/         # Partner intimacy view
│   │   ├── _components/PartnerIntimacy/ # Partner component
│   │   └── page.tsx              # Partner route
│   ├── settings/                 # User Settings
│   │   ├── _components/SettingsPage/ # Settings component
│   │   └── page.tsx              # Settings route
│   ├── pricing/                  # Pricing page
│   │   ├── _components/PricingPage/ # Pricing component
│   │   └── page.tsx              # Pricing route
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login page
│   │   ├── signup/               # Signup page
│   │   ├── callback/             # Auth callback
│   │   └── verify-email/         # Email verification
│   └── api/                      # API routes
├── features/                     # Feature-based modules
│   ├── auth/                     # Authentication features
│   │   ├── components/           # Auth components
│   │   ├── hooks/                # Auth hooks
│   │   ├── api/                  # Auth API calls
│   │   └── tests/                # Auth tests
│   ├── cycle/                    # Cycle tracking features
│   │   ├── components/           # Cycle components
│   │   ├── hooks/                # Cycle hooks
│   │   ├── api/                  # Cycle API calls
│   │   └── tests/                # Cycle tests
│   ├── intimacy/                 # Intimacy features
│   │   ├── components/           # Intimacy components
│   │   ├── hooks/                # Intimacy hooks
│   │   ├── api/                  # Intimacy API calls
│   │   ├── tests/                # Intimacy tests
│   │   └── _lib/                 # Intimacy utilities
│   ├── ai-coach/                 # AI Coach features
│   │   ├── components/           # AI Coach components
│   │   ├── hooks/                # AI Coach hooks
│   │   ├── api/                  # AI Coach API calls
│   │   └── tests/                # AI Coach tests
│   └── fantasy/                  # Fantasy features
│       ├── components/           # Fantasy components
│       ├── hooks/                # Fantasy hooks
│       ├── api/                  # Fantasy API calls
│       └── tests/                # Fantasy tests
├── components/                   # Shared UI components
├── context/                      # React Context providers
├── lib/                          # Shared utilities and helpers
│   ├── storage.ts                # Local storage management
│   ├── mockData.ts               # Demo data
│   ├── db.ts                     # Database abstraction
│   └── supabaseClient.ts         # Supabase client
├── types/                        # TypeScript definitions
└── __tests__/                    # Global test setup
```

### 📁 Additional Folders

```
docs/                             # Documentation
├── SUPABASE_CONFIG.md           # Supabase configuration guide
├── SUPABASE_SETUP.md            # Setup instructions
└── TODO.md                      # Development roadmap

database/                         # Database schemas
├── supabase-schema.sql          # Main database schema
├── intimacy-schema.sql          # Intimacy feature schema
└── supabase-initial-schema.sql  # Initial setup schema

scripts/                          # Development scripts
├── debug-login.js               # Login debugging
├── demo-signup-flow.js          # Signup flow demo
├── test-db-connection.js        # Database connection test
└── test-signup.js               # Signup testing
```

### 🏗️ Architecture Principles

- **Feature-Based Organization**: Each feature has its own module with components, hooks, API calls, and tests
- **Component Co-location**: Page components are located near their routes for better maintainability
- **Separation of Concerns**: Clear separation between routing (`page.tsx`) and component logic
- **Database Abstraction**: All database access goes through `/lib/db.ts` for easy provider swapping
- **Type Safety**: Zod schemas for validation and TypeScript for type checking
- **Testing**: Vitest for unit tests, Playwright for e2e tests
- **Accessibility**: WCAG AA compliance with proper focus management and contrast ratios

## 🎨 Key Components

### Dashboard (Cycle Tracker)
- **Location**: `src/app/dashboard/_components/Dashboard/`
- Daily data logging with quick entry modal
- Visual calendar with cycle phases
- Mood, energy, and symptom tracking
- Personalized insights and recommendations
- Dark mode optimized with proper contrast

### AI Coach
- **Location**: `src/app/ai-coach/_components/AICoach/`
- Natural language chat interface
- Context-aware responses based on cycle data
- Suggested conversation starters
- Real-time typing indicators

### Intimacy Deck
- **Location**: `src/app/intimacy/_components/`
- **Components**: BoundaryManager, TodayCardSelector, ReflectionForm, ShareToggle
- Daily intimacy card selection
- Boundary management (yes/maybe/no)
- Partner sharing with consent
- Reflection and session tracking

### Partner Intimacy View
- **Location**: `src/app/partner/intimacy/_components/PartnerIntimacy/`
- Read-only partner access to shared sessions
- Supportive actions and responses
- Privacy-controlled content sharing

### Fantasy Vault
- **Location**: `src/app/fantasy/_components/FantasyPage/`
- Rich text entry creation and editing
- Tag-based organization
- Privacy controls and selective sharing
- Mood and phase correlation

### Settings & Privacy
- **Location**: `src/app/settings/_components/SettingsPage/`
- Granular privacy controls
- Subscription management
- Data export and deletion
- Partner invitation and management

### Pricing
- **Location**: `src/app/pricing/_components/PricingPage/`
- Subscription plan comparison
- Feature breakdown by tier
- Payment integration ready

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

## 🧪 Development & Testing

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run Vitest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:ci      # Run tests for CI/CD

# Database
npm run seed:intimacy # Seed intimacy cards
```

### Testing Strategy

- **Unit Tests**: Vitest for component and utility testing
- **E2E Tests**: Playwright for full user journey testing
- **Schema Validation**: Zod schemas for type safety
- **Database Testing**: Supabase integration tests

### Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Component Structure**: Follow the established pattern with `_components/` folders
3. **Database Changes**: Update schemas in `database/` folder
4. **Testing**: Add tests for new features
5. **Documentation**: Update README and docs as needed

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines and code of conduct.

1. Fork the repository
2. Create a feature branch from `develop`
3. Follow the established component structure
4. Add tests for new features
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with love for women's wellness and relationship health
- Inspired by the need for privacy-first intimate technology
- Thank you to all the women who shared their stories and needs

---

**Made with 💝 for women and their partners**

*SheSync+ - Because your cycle is your superpower* ✨
