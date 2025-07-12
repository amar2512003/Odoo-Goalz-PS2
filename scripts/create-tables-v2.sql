-- Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS answers ENABLE ROW LEVEL SECURITY;

-- Create users table (simplified for Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table for upvote/downvote functionality
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 for downvote, 1 for upvote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, answer_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON answers(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_answer_id ON votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert questions" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own questions" ON questions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Answers are viewable by everyone" ON answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert answers" ON answers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own answers" ON answers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Votes are viewable by everyone" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert votes" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes" ON votes FOR DELETE USING (auth.uid() = user_id);
