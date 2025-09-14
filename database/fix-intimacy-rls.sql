-- Fix RLS policies for intimacy_cards to allow seeding
-- This allows authenticated users to insert intimacy cards (for seeding purposes)

-- Add INSERT policy for intimacy_cards
CREATE POLICY "cards_authenticated_insert"
    ON public.intimacy_cards FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Add UPDATE policy for intimacy_cards (for admin purposes)
CREATE POLICY "cards_authenticated_update"
    ON public.intimacy_cards FOR UPDATE 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Add DELETE policy for intimacy_cards (for admin purposes)
CREATE POLICY "cards_authenticated_delete"
    ON public.intimacy_cards FOR DELETE 
    USING (auth.uid() IS NOT NULL);
