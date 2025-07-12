"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, User, LogOut, TrendingUp, Clock, MessageCircle } from "lucide-react"
import { LoginDialog } from "@/components/login-dialog"
import { NotificationBell } from "@/components/notification-bell"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

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

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterBy, setFilterBy] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [communityStats, setCommunityStats] = useState({
    questions: 0,
    answers: 0,
    users: 0,
  })

  const { user, loading, signOut } = useAuth()
  const questionsPerPage = 10

  useEffect(() => {
    fetchQuestions()
    fetchCommunityStats()
  }, [currentPage, sortBy, filterBy, searchTerm])

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("questions").select(
        `
          id,
          title,
          description,
          tags,
          user_id,
          created_at,
          users(username)
        `,
        { count: "exact" },
      )

      // Search
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      }

      // Sort
      if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true })
      } else {
        // default newest
        query = query.order("created_at", { ascending: false })
      }

      // Pagination
      const from = (currentPage - 1) * questionsPerPage
      const to = from + questionsPerPage - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setQuestions(data || [])
      setTotalPages(Math.max(1, Math.ceil((count || 0) / questionsPerPage)))
    } catch (error) {
      console.error("Error fetching questions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCommunityStats = async () => {
    try {
      // Get questions count
      const { count: questionsCount } = await supabase.from("questions").select("*", { count: "exact", head: true })

      // Get answers count
      const { count: answersCount } = await supabase.from("answers").select("*", { count: "exact", head: true })

      // Get users count
      const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

      setCommunityStats({
        questions: questionsCount || 0,
        answers: answersCount || 0,
        users: usersCount || 0,
      })
    } catch (error) {
      console.error("Error fetching community stats:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

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

            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-white/30 focus:bg-white focus:border-blue-300 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/ask">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Ask Question
                    </Button>
                  </Link>
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
                <Button
                  onClick={() => setShowLoginDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Welcome Section */}
            {!user && (
              <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
                <CardContent className="p-8">
                  <h1 className="text-3xl font-bold mb-4">Welcome to StackIt</h1>
                  <p className="text-blue-100 mb-6">
                    A collaborative learning platform where you can ask questions, share knowledge, and learn from the
                    community.
                  </p>
                  <Button
                    onClick={() => setShowLoginDialog(true)}
                    variant="secondary"
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Filters and Sort */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-white/70 border-white/30">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Newest
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Oldest
                      </div>
                    </SelectItem>
                    <SelectItem value="most-answered">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Most Answered
                      </div>
                    </SelectItem>
                    <SelectItem value="unanswered">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Unanswered
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-[180px] bg-white/70 border-white/30">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Questions</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="unanswered">Unanswered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {user && (
                <Link href="/ask">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Ask Your Question
                  </Button>
                </Link>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading questions...</p>
                </div>
              ) : questions.length === 0 ? (
                <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
                  <CardContent className="py-12 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No questions found</p>
                    <p>Be the first to ask a question!</p>
                  </CardContent>
                </Card>
              ) : (
                questions.map((question) => (
                  <Card
                    key={question.id}
                    className="bg-white/70 backdrop-blur-sm border-white/30 hover:bg-white/90 hover:shadow-xl transition-all duration-300 group"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link href={`/questions/${question.id}`}>
                            <CardTitle className="text-lg text-gray-800 group-hover:text-blue-600 cursor-pointer transition-colors">
                              {question.title}
                            </CardTitle>
                          </Link>
                          <p className="text-gray-600 mt-2 line-clamp-2">{question.description.substring(0, 200)}...</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6 ring-1 ring-gray-200">
                              <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                {question.users.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{question.users.username}</span>
                            <span>•</span>
                            <span>{formatDate(question.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/70 border-white/30 hover:bg-white"
                >
                  Previous
                </Button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : "bg-white/70 border-white/30 hover:bg-white"
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/70 border-white/30 hover:bg-white"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80">
            <Card className="bg-white/70 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Browse by</h4>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Most Recent
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-600"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Unanswered
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm hover:bg-blue-50 hover:text-blue-600"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trending
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Community Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span className="font-medium">{communityStats.questions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Answers:</span>
                    <span className="font-medium">{communityStats.answers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Users:</span>
                    <span className="font-medium">{communityStats.users.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  )
}
