-- Migration: Add 'quote' to post_type enum
ALTER TYPE public.post_type ADD VALUE IF NOT EXISTS 'quote';
