#!/bin/zsh

# Ensure we're in the project root
cd "$(dirname "$0")/src" || exit 1

echo "🚀 Starting folder reorganisation..."

# 1. Create the clean folder structure
mkdir -p components/{ui,layout}
mkdir -p features/{auth/{components,hooks,utils},ai-coach/{components,hooks,utils},dashboard/{components,hooks,utils},intimacy/{components,hooks,utils}}
mkdir -p {hooks,lib,styles,types,tests}

# 2. Move non-route items out of app/ if they exist
[ -d app/hooks ] && mv app/hooks/* hooks/ 2>/dev/null
[ -d app/lib ] && mv app/lib/* lib/ 2>/dev/null
[ -d app/styles ] && mv app/styles/* styles/ 2>/dev/null
[ -d app/tests ] && mv app/tests/* tests/ 2>/dev/null
rm -rf app/hooks app/lib app/styles app/tests

# 3. Move feature-specific code into features/
# Auth
if [ -d app/auth ]; then
  mkdir -p features/auth/{components,hooks,utils}
  [ -d app/auth/components ] && mv app/auth/components/* features/auth/components/ 2>/dev/null
  [ -d app/auth/hooks ] && mv app/auth/hooks/* features/auth/hooks/ 2>/dev/null
  [ -d app/auth/utils ] && mv app/auth/utils/* features/auth/utils/ 2>/dev/null
fi

# AI Coach
if [ -d app/ai-coach ]; then
  mkdir -p features/ai-coach/{components,hooks,utils}
  [ -d app/ai-coach/components ] && mv app/ai-coach/components/* features/ai-coach/components/ 2>/dev/null
  [ -d app/ai-coach/hooks ] && mv app/ai-coach/hooks/* features/ai-coach/hooks/ 2>/dev/null
  [ -d app/ai-coach/utils ] && mv app/ai-coach/utils/* features/ai-coach/utils/ 2>/dev/null
fi

# Dashboard
if [ -d app/dashboard ]; then
  mkdir -p features/dashboard/{components,hooks,utils}
  [ -d app/dashboard/components ] && mv app/dashboard/components/* features/dashboard/components/ 2>/dev/null
  [ -d app/dashboard/hooks ] && mv app/dashboard/hooks/* features/dashboard/hooks/ 2>/dev/null
  [ -d app/dashboard/utils ] && mv app/dashboard/utils/* features/dashboard/utils/ 2>/dev/null
fi

# Intimacy
if [ -d app/intimacy ]; then
  mkdir -p features/intimacy/{components,hooks,utils}
  [ -d app/intimacy/components ] && mv app/intimacy/components/* features/intimacy/components/ 2>/dev/null
  [ -d app/intimacy/hooks ] && mv app/intimacy/hooks/* features/intimacy/hooks/ 2>/dev/null
  [ -d app/intimacy/utils ] && mv app/intimacy/utils/* features/intimacy/utils/ 2>/dev/null
fi

# 4. Fix misplaced components (LandingPage into intimacy feature, adjust if needed)
if [ -f components/LandingPage.tsx ]; then
  mv components/LandingPage.tsx features/intimacy/components/ 2>/dev/null
fi

echo "✅ Reorganisation complete! Now update your imports to the new paths."
