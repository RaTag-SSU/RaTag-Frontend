"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Send,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  ThumbsUp,
  ThumbsDown,
  Tag,
  Plus,
  X,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface Problem {
  id: number
  title: string
  content: string
  sourcePath: string
  type: "SHORT_ANSWER" | "MULTIPLE_CHOICE"
  choices: string | null
  answer: string
  pdfUrl?: string
  imageUrl?: string
}

interface TagInfo {
  tagName: string
  voteCount: number
  votedByMe: boolean
}

const circleNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"]

export default function SolvePage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.problemId as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [userAnswer, setUserAnswer] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [difficulty, setDifficulty] = useState<number | null>(null)
  const [leftPaneWidth, setLeftPaneWidth] = useState(60)
  const [isDragging, setIsDragging] = useState(false)

  // Tags
  const [problemTags, setProblemTags] = useState<TagInfo[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tagSuggestions, setTagSuggestions] = useState<{ id: number; name: string; description?: string }[]>([])
  const [showTagSection, setShowTagSection] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (!problemId) {
      alert("잘못된 접근입니다. 문제 ID가 없습니다.")
      router.push("/groups")
      return
    }

    // Check login status
    fetch("/api/users/me")
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false))

    // Load problem
    fetch(`/api/problems/${problemId}`)
      .then((res) => {
        if (!res.ok) throw new Error("문제를 불러오지 못했습니다.")
        return res.json()
      })
      .then((data) => {
        setProblem(data)
        setLoading(false)
        loadProblemTags()
      })
      .catch((error) => {
        console.error("API 연동 에러:", error)
        alert("서버와 통신하는 중 문제가 발생했습니다.")
        setLoading(false)
      })
  }, [problemId, router])

  const loadProblemTags = async () => {
    try {
      const res = await fetch(`/api/problems/${problemId}/tags`)
      if (res.ok) {
        const data = await res.json()
        setProblemTags(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMouseDown = () => {
    setIsDragging(true)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      let newWidthPercent = (e.clientX / window.innerWidth) * 100
      if (newWidthPercent < 30) newWidthPercent = 30
      if (newWidthPercent > 80) newWidthPercent = 80
      setLeftPaneWidth(newWidthPercent)
    },
    [isDragging]
  )

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      document.body.style.cursor = "default"
      document.body.style.userSelect = "auto"
    }
  }, [isDragging])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const submitAnswer = async () => {
    if (!problem) return

    if (!userAnswer) {
      alert(problem.type === "MULTIPLE_CHOICE" ? "정답을 선택해주세요!" : "정답을 입력해주세요!")
      return
    }

    const correct = userAnswer === problem.answer
    setIsCorrect(correct)
    setIsSubmitted(true)

    // Record submission to API
    if (isLoggedIn) {
      try {
        await fetch(`/api/problems/${problemId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answer: userAnswer,
            result: correct ? "SUCCESS" : "FAIL",
          }),
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  const submitDifficulty = async (value: number) => {
    setDifficulty(value)
    if (isLoggedIn) {
      try {
        await fetch(`/api/problems/${problemId}/difficulty`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty: value }),
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  const fetchTagSuggestions = async (query: string) => {
    if (!query.trim()) {
      setTagSuggestions([])
      return
    }
    try {
      const res = await fetch(`/api/tags/search?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setTagSuggestions(data)
    } catch (e) {
      console.error(e)
    }
  }

  const voteTag = async (tagName: string) => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.")
      return
    }
    try {
      await fetch(`/api/problems/${problemId}/tags/${encodeURIComponent(tagName)}/vote`, {
        method: "POST",
      })
      loadProblemTags()
    } catch (e) {
      console.error(e)
    }
  }

  const unvoteTag = async (tagName: string) => {
    if (!isLoggedIn) return
    try {
      await fetch(`/api/problems/${problemId}/tags/${encodeURIComponent(tagName)}/vote`, {
        method: "DELETE",
      })
      loadProblemTags()
    } catch (e) {
      console.error(e)
    }
  }

  const addNewTag = async (tagName: string) => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.")
      return
    }
    try {
      await fetch(`/api/problems/${problemId}/tags/${encodeURIComponent(tagName)}/vote`, {
        method: "POST",
      })
      setTagInput("")
      setTagSuggestions([])
      loadProblemTags()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">문제를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!problem) return null

  const choices =
    problem.type === "MULTIPLE_CHOICE" && problem.choices
      ? (() => {
          try {
            return JSON.parse(problem.choices) as string[]
          } catch {
            return []
          }
        })()
      : []

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Pane - Problem Viewer */}
      <div
        className="bg-card border-r border-border flex flex-col overflow-hidden"
        style={{ width: `${leftPaneWidth}%` }}
      >
        {problem.pdfUrl ? (
          <iframe src={problem.pdfUrl} className="w-full h-full border-none" title="PDF Viewer" />
        ) : (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              {/* Problem Content Header */}
              <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm">문제 내용</span>
              </div>

              {/* Problem Text */}
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {problem.content || "문제 내용이 없습니다."}
                </p>
              </div>

              {/* Problem Image */}
              {problem.imageUrl && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">첨부 이미지</span>
                  </div>
                  <img
                    src={problem.imageUrl}
                    alt="문제 첨부 이미지"
                    className="rounded-lg border border-border max-w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resizer */}
      <div
        className="w-2 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="w-0.5 h-8 bg-muted-foreground/30 rounded-full" />
      </div>

      {/* Right Pane - Answer Submission */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6 flex-1">
          {/* Back Navigation */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            이전 화면으로
          </button>

          {/* Problem Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">{problem.title}</h1>
            <Badge variant="secondary" className="text-sm">
              {problem.sourcePath || "분류 없음"}
            </Badge>
          </div>

          {/* Answer Section */}
          {!isSubmitted ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  정답 입력
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {problem.type === "MULTIPLE_CHOICE" && choices.length > 0 ? (
                  <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                    <div className="space-y-3">
                      {choices.map((choice, index) => (
                        <Label
                          key={index}
                          htmlFor={`choice-${index}`}
                          className="flex items-center gap-3 p-4 rounded-lg border border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 hover:border-primary/50 transition-all [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/10"
                        >
                          <RadioGroupItem
                            value={String(index + 1)}
                            id={`choice-${index}`}
                            className="border-muted-foreground"
                          />
                          <span className="text-foreground">
                            {circleNumbers[index] || `(${index + 1})`} {choice}
                          </span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="answer">답안</Label>
                    <Input
                      id="answer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="정답을 입력하세요"
                      className="bg-input border-border text-lg py-6"
                    />
                  </div>
                )}

                <Button
                  onClick={submitAnswer}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg"
                >
                  <Send className="mr-2 h-5 w-5" />
                  제출 및 채점하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Result Card */}
              <Card
                className={`border-2 ${
                  isCorrect ? "bg-green-500/10 border-green-500/50" : "bg-red-500/10 border-red-500/50"
                }`}
              >
                <CardContent className="flex flex-col items-center justify-center py-8">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                      <h2 className="text-2xl font-bold text-green-500 mb-2">정답입니다!</h2>
                      <p className="text-muted-foreground">훌륭하게 풀어내셨네요.</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-16 w-16 text-red-500 mb-4" />
                      <h2 className="text-2xl font-bold text-red-500 mb-2">틀렸습니다</h2>
                      <p className="text-muted-foreground">
                        제출한 답: <span className="font-medium">{userAnswer}</span>
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Difficulty Feedback */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    난이도 평가
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">이 문제의 예상 정답률은 얼마라고 생각하시나요?</p>
                  <div className="flex flex-wrap gap-2">
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((val) => (
                      <Button
                        key={val}
                        variant={difficulty === val ? "default" : "outline"}
                        size="sm"
                        onClick={() => submitDifficulty(val)}
                        className={difficulty === val ? "bg-primary" : ""}
                      >
                        {val}%
                      </Button>
                    ))}
                  </div>
                  {difficulty && (
                    <p className="text-sm text-green-500">평가가 반영되었습니다: 예상 정답률 {difficulty}%</p>
                  )}
                </CardContent>
              </Card>

              {/* Tag Section */}
              <Card className="bg-card border-border">
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowTagSection(!showTagSection)}
                >
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-primary" />
                      태그 투표
                    </div>
                    {showTagSection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showTagSection && (
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      이 문제에 적절한 태그에 공감해주세요. 태그가 없으면 새로 제안할 수 있습니다.
                    </p>

                    {/* Existing Tags */}
                    {problemTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {problemTags.map((tagInfo) => (
                          <Badge
                            key={tagInfo.tagName}
                            variant={tagInfo.votedByMe ? "default" : "outline"}
                            className={`cursor-pointer transition-all ${
                              tagInfo.votedByMe
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-secondary"
                            }`}
                            onClick={() =>
                              tagInfo.votedByMe ? unvoteTag(tagInfo.tagName) : voteTag(tagInfo.tagName)
                            }
                          >
                            {tagInfo.votedByMe ? (
                              <ThumbsUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ThumbsDown className="mr-1 h-3 w-3 opacity-50" />
                            )}
                            #{tagInfo.tagName} ({tagInfo.voteCount})
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Separator />

                    {/* Add New Tag */}
                    <div className="space-y-2">
                      <Label className="text-sm">새 태그 제안</Label>
                      <div className="relative">
                        <Input
                          value={tagInput}
                          onChange={(e) => {
                            setTagInput(e.target.value)
                            fetchTagSuggestions(e.target.value)
                          }}
                          placeholder="태그를 검색하거나 입력하세요"
                          className="bg-input border-border"
                        />
                        {tagSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {tagSuggestions.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => addNewTag(tag.name)}
                                className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4 text-primary" />
                                <span className="font-bold text-foreground">#{tag.name}</span>
                                {tag.description && (
                                  <span className="text-xs text-muted-foreground">{tag.description}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Next Action */}
              <Link href="/search">
                <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                  다음 문제 탐색
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
