"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    const { error } = await signIn(username, password)

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      })
    } else {
      onOpenChange(false)
      toast({
        title: "Success",
        description: "Logged in successfully!",
      })
    }

    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    const { error } = await signUp(username, password)

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
    } else {
      onOpenChange(false)
      toast({
        title: "Success",
        description: "Account created successfully! You can now start asking questions.",
      })
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to StackIt</DialogTitle>
          <DialogDescription>
            Sign in to your account or create a new one to start asking and answering questions.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-username">Username</Label>
                <Input
                  id="signin-username"
                  name="username"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  name="username"
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Choose a username"
                />
                <p className="text-xs text-gray-500">This will be your display name on the platform</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="Create a password"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <Input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  disabled={isLoading}
                  placeholder="Confirm your password"
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
