"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, LogOut, HelpCircle, Lightbulb } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    try {
      const tagsArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const { data, error } = await supabase
        .from("questions")
        .insert([
          {
            title,
            description,
            tags: tagsArray,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Your question has been posted!",
      })

      router.push(`/questions/${data.id}`)
    } catch (error) {
      console.error("Error posting question:", error)
      toast({
        title: "Error",
        description: "Failed to post question. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                StackIt
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8 ring-2 ring-blue-200">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  title="Logout"
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Link>
        </div>

        {/* Tips Card */}
        <Card className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <Lightbulb className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Tips for a great question</h3>
                <ul className="text-sm text-amber-100 space-y-1">
                  <li>• Be specific and clear about what you're asking</li>
                  <li>• Include relevant details and context</li>
                  <li>• Use proper tags to help others find your question</li>
                  <li>• You can mention users with @username in your description</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center">
              <HelpCircle className="h-6 w-6 mr-3" />
              Ask a Question
            </CardTitle>
            <p className="text-blue-100">Be specific and imagine you're asking a question to another person</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-lg font-medium">
                  Title
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="What's your programming question? Be specific."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="bg-white/70 border-white/30 focus:bg-white focus:border-blue-300 transition-all"
                />
                <p className="text-sm text-gray-500">
                  Be specific and imagine you're asking a question to another person
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-lg font-medium">
                  Description
                </Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Include all the information someone would need to answer your question. You can mention users with @username"
                />
                <p className="text-sm text-gray-500">
                  Include all the information someone would need to answer your question
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-lg font-medium">
                  Tags
                </Label>
                <Input
                  id="tags"
                  type="text"
                  placeholder="e.g. javascript, react, css (comma-separated)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-white/70 border-white/30 focus:bg-white focus:border-blue-300 transition-all"
                />
                <p className="text-sm text-gray-500">
                  Add up to 5 tags to describe what your question is about (comma-separated)
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Link href="/">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    className="bg-white/70 border-white/30 hover:bg-white"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  {isSubmitting ? "Posting..." : "Post Your Question"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
