"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, LogOut, CheckCircle, ChevronUp, ChevronDown, MessageSquare, Calendar } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { createNotification, extractMentions } from "@/lib/notifications"

type Question = {
  id: string
  title: string
  description: string
  tags: string[]
  user_id: string
  created_at: string
  users: {
    username: string
  }
}

type Answer = {
  id: string
  content: string
  question_id: string
  user_id: string
  created_at: string
  users: {
    username: string
  }
  vote_score: number
  user_vote: number | null
}

export default function QuestionDetailPage() {
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [newAnswer, setNewAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const { user, loading, signOut } = useAuth()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      fetchQuestion()
      fetchAnswers()
    }
  }, [params.id, user])

  const fetchQuestion = async () => {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          *,
          users!inner(username)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setQuestion(data)
    } catch (error) {
      console.error("Error fetching question:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from("answers")
        .select(`
          *,
          users!inner(username)
        `)
        .eq("question_id", params.id)
        .order("created_at", { ascending: true })

      if (error) throw error

      const answersWithVotes = await Promise.all(
        (data || []).map(async (answer) => {
          const { data: voteData } = await supabase.from("votes").select("vote_type").eq("answer_id", answer.id)
          const voteScore = voteData?.reduce((sum, vote) => sum + vote.vote_type, 0) || 0

          let userVote = null
          if (user) {
            const { data: userVoteData } = await supabase
              .from("votes")
              .select("vote_type")
              .eq("answer_id", answer.id)
              .eq("user_id", user.id)
              .single()

            userVote = userVoteData?.vote_type || null
          }

          return {
            ...answer,
            vote_score: voteScore,
            user_vote: userVote,
          }
        }),
      )

      answersWithVotes.sort((a, b) => b.vote_score - a.vote_score)
      setAnswers(answersWithVotes)
    } catch (error) {
      console.error("Error fetching answers:", error)
    }
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newAnswer.trim() || !question) return

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase
        .from("answers")
        .insert([
          {
            content: newAnswer,
            question_id: params.id as string,
            user_id: user.id,
          },
        ])
        .select(`
          *,
          users!inner(username)
        `)
        .single()

      if (error) throw error

      // Create notification for question author
      if (question.user_id !== user.id) {
        await createNotification({
          userId: question.user_id,
          type: "answer",
          title: "New answer to your question",
          message: `${user.username} answered your question: "${question.title}"`,
          relatedQuestionId: question.id,
          relatedAnswerId: data.id,
          relatedUserId: user.id,
        })
      }

      // Handle mentions in the answer
      const mentions = extractMentions(newAnswer)
      for (const mentionedUsername of mentions) {
        // Find the mentioned user
        const { data: mentionedUser } = await supabase
          .from("users")
          .select("id")
          .eq("username", mentionedUsername)
          .single()

        if (mentionedUser && mentionedUser.id !== user.id) {
          await createNotification({
            userId: mentionedUser.id,
            type: "mention",
            title: "You were mentioned",
            message: `${user.username} mentioned you in an answer to: "${question.title}"`,
            relatedQuestionId: question.id,
            relatedAnswerId: data.id,
            relatedUserId: user.id,
          })
        }
      }

      const newAnswerWithVotes = {
        ...data,
        vote_score: 0,
        user_vote: null,
      }

      setAnswers([...answers, newAnswerWithVotes])
      setNewAnswer("")
      toast({
        title: "Success",
        description: "Your answer has been posted!",
      })
    } catch (error) {
      console.error("Error posting answer:", error)
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (answerId: string, voteType: number) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to vote.",
        variant: "destructive",
      })
      return
    }

    try {
      const currentAnswer = answers.find((a) => a.id === answerId)
      if (!currentAnswer) return

      if (currentAnswer.user_vote === voteType) {
        await supabase.from("votes").delete().eq("answer_id", answerId).eq("user_id", user.id)
      } else {
        await supabase.from("votes").upsert(
          {
            answer_id: answerId,
            user_id: user.id,
            vote_type: voteType,
          },
          {
            onConflict: "user_id,answer_id",
          },
        )

        // Create notification for answer author (only for upvotes)
        if (voteType === 1 && currentAnswer.user_id !== user.id) {
          await createNotification({
            userId: currentAnswer.user_id,
            type: "vote",
            title: "Your answer was upvoted",
            message: `${user.username} upvoted your answer`,
            relatedQuestionId: question?.id,
            relatedAnswerId: answerId,
            relatedUserId: user.id,
          })
        }
      }

      await fetchAnswers()
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-600">Question not found</p>
        </div>
      </div>
    )
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
              {user ? (
                <>
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
                </>
              ) : (
                <Link href="/">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                    Login to Answer
                  </Button>
                </Link>
              )}
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

        {/* Question */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">{question.title}</CardTitle>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-sm text-blue-100">
                <Avatar className="h-6 w-6 ring-1 ring-white/30">
                  <AvatarFallback className="text-xs bg-white/20 text-white">
                    {question.users.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{question.users.username}</span>
                <span>•</span>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(question.created_at)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: question.description
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                  .replace(/~~(.*?)~~/g, "<del>$1</del>")
                  .replace(
                    /!\[(.*?)\]$$(.*?)$$/g,
                    '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md" />',
                  )
                  .replace(
                    /@(\w+)/g,
                    '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">@$1</span>',
                  )
                  .replace(/\n/g, "<br>"),
              }}
            />
          </CardContent>
        </Card>

        {/* Answers Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
          </h2>

          {answers.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
              <CardContent className="py-12 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No answers yet</p>
                <p>Be the first to answer this question!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {answers.map((answer, index) => (
                <Card
                  key={answer.id}
                  className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Vote buttons */}
                      <div className="flex flex-col items-center space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(answer.id, 1)}
                          className={`p-2 rounded-full transition-all ${
                            answer.user_vote === 1
                              ? "text-green-600 bg-green-50 hover:bg-green-100"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                          }`}
                          disabled={!user}
                        >
                          <ChevronUp className="h-6 w-6" />
                        </Button>
                        <span
                          className={`font-bold text-lg ${answer.vote_score > 0 ? "text-green-600" : answer.vote_score < 0 ? "text-red-600" : "text-gray-600"}`}
                        >
                          {answer.vote_score}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(answer.id, -1)}
                          className={`p-2 rounded-full transition-all ${
                            answer.user_vote === -1
                              ? "text-red-600 bg-red-50 hover:bg-red-100"
                              : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                          }`}
                          disabled={!user}
                        >
                          <ChevronDown className="h-6 w-6" />
                        </Button>
                      </div>

                      {/* Answer content */}
                      <div className="flex-1">
                        <div
                          className="prose max-w-none mb-4"
                          dangerouslySetInnerHTML={{
                            __html: answer.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>")
                              .replace(/~~(.*?)~~/g, "<del>$1</del>")
                              .replace(
                                /!\[(.*?)\]$$(.*?)$$/g,
                                '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-md" />',
                              )
                              .replace(
                                /@(\w+)/g,
                                '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">@$1</span>',
                              )
                              .replace(/\n/g, "<br>"),
                          }}
                        />
                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {index === 0 && answer.vote_score > 0 && (
                              <div className="flex items-center space-x-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Top Answer</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Avatar className="h-6 w-6 ring-1 ring-gray-200">
                              <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {answer.users.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{answer.users.username}</span>
                            <span>•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(answer.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Answer Form */}
        {user ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Your Answer
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <RichTextEditor
                  value={newAnswer}
                  onChange={setNewAnswer}
                  placeholder="Write your answer here... You can mention users with @username"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newAnswer.trim()}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg"
                  >
                    {isSubmitting ? "Posting..." : "Post Your Answer"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-xl">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4 text-lg">You need to be logged in to post an answer.</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                  Login to Answer
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
