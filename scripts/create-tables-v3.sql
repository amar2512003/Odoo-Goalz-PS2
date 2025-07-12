-- Drop existing tables if they exist
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create users table (standalone, no Supabase Auth dependency)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table for upvote/downvote functionality
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, answer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_answer_id ON votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
