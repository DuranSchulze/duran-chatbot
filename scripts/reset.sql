-- Database reset for Duran Chatbot
-- Truncates all tables in dependency order, wiping data but preserving schema
-- This is safe to run — tables and indexes are kept, only data is removed

TRUNCATE TABLE "Message" CASCADE;
TRUNCATE TABLE "Conversation" CASCADE;
TRUNCATE TABLE "QuoteRequest" CASCADE;
TRUNCATE TABLE "Config" CASCADE;
TRUNCATE TABLE "EmailIntegration" CASCADE;
TRUNCATE TABLE "Profile" CASCADE;
