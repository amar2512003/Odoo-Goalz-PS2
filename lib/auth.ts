import { supabase } from "./supabase"

// Simple hash function for passwords (in production, use proper bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "stackit_salt")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function signUp(username: string, password: string) {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("username", username).single()

    if (existingUser) {
      return { user: null, error: new Error("Username already exists") }
    }

    const hashedPassword = await hashPassword(password)

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          password_hash: hashedPassword,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return { user: data, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}

export async function signIn(username: string, password: string) {
  try {
    const hashedPassword = await hashPassword(password)

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", hashedPassword)
      .single()

    if (error || !user) {
      throw new Error("Invalid username or password")
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error as Error }
  }
}
