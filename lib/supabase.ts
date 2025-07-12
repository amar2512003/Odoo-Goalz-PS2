import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          title: string
          description: string
          tags: string[]
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          tags?: string[]
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          tags?: string[]
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          content: string
          question_id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          question_id: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          question_id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          answer_id: string
          vote_type: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          answer_id: string
          vote_type: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          answer_id?: string
          vote_type?: number
          created_at?: string
        }
      }
    }
  }
}
