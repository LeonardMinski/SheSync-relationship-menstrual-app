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
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
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
app/        -> routes and API endpoints
components/ -> UI components
context/    -> global React state
hooks/      -> reusable React behaviour
lib/        -> infrastructure and low-level integrations
schemas/    -> runtime validation
services/   -> business and data operations
styles/     -> design system and CSS
test/       -> global test setup
types/      -> shared TypeScript contracts
utils/      -> pure reusable helpers
```

### Current Route Groups

```
src/app/
├── (public)/                 # Landing, pricing, and auth pages
├── (app)/                    # Authenticated app pages
└── api/                      # Route handlers
    ├── auth/
    ├── checkout/
    ├── coach/                # Streaming AI coach endpoint
    │   └── messages/         # Saved coach message history
    ├── cycle/                # Cycle CRUD and logging
    ├── fantasy/
    ├── intimacy/
    ├── partner/
    │   └── shared-data/      # Privacy-filtered partner data
    ├── user/
    └── webhooks/stripe/
```

### Service Layout

```
src/services/
├── auth/                     # Auth service entry point
├── cycle/insights.ts         # Cycle tips and wellness suggestions
├── fantasy/entries.ts        # Fantasy vault entry operations
├── intimacy/                 # Intimacy boundaries, cards, sessions, sharing
├── partner/data.ts           # Partner portal data access
└── privacy/settings.ts       # Privacy settings read/update operations
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
├── db/                          # Database setup and seed scripts
├── debug/                       # Local debugging helpers
└── project/                     # Project organization scripts

tests/e2e/                       # Playwright specs live here when added
```

### 🏗️ Architecture Principles

- **Route-Focused App Directory**: `src/app/` contains pages, layouts, loading/error states, and API route handlers
- **Shared UI Components**: Domain and generic UI live under `src/components/`, with reusable primitives in `src/components/ui/`
- **Business Services**: Database and workflow operations live in `src/services/` using responsibility-based file names
- **Infrastructure Boundary**: Supabase clients, API helpers, and env validation live in `src/lib/`
- **Type Safety**: Zod schemas for validation and TypeScript for type checking
- **Testing**: Vitest is the active unit test suite; Playwright specs belong in `tests/e2e/` when added
- **Accessibility**: WCAG AA compliance with proper focus management and contrast ratios

## 🎨 Key Components

### Dashboard (Cycle Tracker)
- **Location**: `src/components/dashboard/Dashboard.tsx`
- Daily data logging with quick entry modal
- Visual calendar with cycle phases
- Mood, energy, and symptom tracking
- Personalized insights and recommendations
- Dark mode optimized with proper contrast

### AI Coach
- **Location**: `src/components/ai-coach/AICoach.tsx`
- Natural language chat interface
- Context-aware responses based on cycle data
- Suggested conversation starters
- Real-time typing indicators

### Intimacy Deck
- **Location**: `src/components/intimacy/`
- **Components**: BoundaryManager, TodayCardSelector, ReflectionForm, ShareToggle
- Daily intimacy card selection
- Boundary management (yes/maybe/no)
- Partner sharing with consent
- Reflection and session tracking

### Partner Intimacy View
- **Location**: `src/components/partner/PartnerIntimacy.tsx`
- Read-only partner access to shared sessions
- Supportive actions and responses
- Privacy-controlled content sharing

### Fantasy Vault
- **Location**: `src/components/fantasy/FantasyPage.tsx`
- Rich text entry creation and editing
- Tag-based organization
- Privacy controls and selective sharing
- Mood and phase correlation

### Settings & Privacy
- **Location**: `src/components/settings/`
- Granular privacy controls
- Subscription management
- Data export and deletion
- Partner invitation and management

### Pricing
- **Location**: `src/components/pricing/PricingPage.tsx`
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
npm run test         # Run the active Vitest suite
npm run test:watch   # Run tests in watch mode
npm run test:ci      # Run tests for CI/CD

# Database
npm run setup:db      # Run database setup helper
npm run seed:intimacy # Seed intimacy cards
```

### Testing Strategy

- **Unit Tests**: Vitest for services, selectors, validation, and focused component logic
- **E2E Tests**: Playwright specs should live under `tests/e2e/` when the suite is reintroduced
- **Schema Validation**: Zod schemas for type safety
- **Database Testing**: Supabase integration tests

### Development Workflow

1. **Feature Development**: Create feature branches from `develop`
2. **Component Structure**: Keep route files in `src/app/` and reusable UI in `src/components/`
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
