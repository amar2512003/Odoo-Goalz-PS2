"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { signIn, signUp } from "@/lib/auth"

type User = {
  id: string
  username: string
  created_at: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  signUp: (username: string, password: string) => Promise<{ error: any }>
  signIn: (username: string, password: string) => Promise<{ error: any }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("stackit-user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem("stackit-user")
      }
    }
    setLoading(false)
  }, [])

  const handleSignUp = async (username: string, password: string) => {
    const { user: newUser, error } = await signUp(username, password)

    if (error) {
      return { error }
    }

    if (newUser) {
      setUser(newUser)
      localStorage.setItem("stackit-user", JSON.stringify(newUser))
    }

    return { error: null }
  }

  const handleSignIn = async (username: string, password: string) => {
    const { user: authUser, error } = await signIn(username, password)

    if (error) {
      return { error }
    }

    if (authUser) {
      setUser(authUser)
      localStorage.setItem("stackit-user", JSON.stringify(authUser))
    }

    return { error: null }
  }

  const handleSignOut = () => {
    setUser(null)
    localStorage.removeItem("stackit-user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
