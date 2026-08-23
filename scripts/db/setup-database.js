#!/usr/bin/env node

/**
 * Database Setup Script for SheSync+
 * 
 * This script helps you set up the database tables and seed data.
 * 
 * Prerequisites:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from the Supabase dashboard
 * 3. Add them to your .env.local file:
 *    NEXT_PUBLIC_SUPABASE_URL=your_project_url
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
 * 
 * Instructions:
 * 1. Copy the SQL from database/supabase-schema.sql
 * 2. Paste it into your Supabase SQL Editor and run it
 * 3. Copy the SQL from database/intimacy-schema.sql  
 * 4. Paste it into your Supabase SQL Editor and run it
 * 5. Run this script to seed the intimacy cards: node scripts/setup-database.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SheSync+ Database Setup Helper');
console.log('=====================================\n');

console.log('📋 STEP 1: Create Supabase Project');
console.log('1. Go to https://supabase.com and create a new project');
console.log('2. Wait for the project to be ready\n');

console.log('📋 STEP 2: Add Environment Variables');
console.log('Add these to your .env.local file:');
console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n');

console.log('📋 STEP 3: Run Database Schema');
console.log('1. Go to your Supabase dashboard → SQL Editor');
console.log('2. Copy the contents of database/supabase-schema.sql');
console.log('3. Paste and run it in the SQL Editor');
console.log('4. Copy the contents of database/intimacy-schema.sql');
console.log('5. Paste and run it in the SQL Editor\n');

console.log('📋 STEP 4: Seed Intimacy Cards');
console.log('Run this command to seed the intimacy cards:');
console.log('npm run seed:intimacy\n');

console.log('📋 STEP 5: Test the Application');
console.log('1. Run: npm run dev');
console.log('2. Go to http://localhost:3000');
console.log('3. Sign up for a new account');
console.log('4. Test the intimacy features\n');

console.log('✅ Setup Complete!');
console.log('Your SheSync+ app should now be fully functional with database support.');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('\n🔍 Checking .env.local...');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL') && envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
    console.log('✅ Environment variables found in .env.local');
  } else {
    console.log('⚠️  Missing Supabase environment variables in .env.local');
    console.log('Please add:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  }
} else {
  console.log('\n⚠️  .env.local file not found');
  console.log('Please create it with your Supabase credentials');
}
