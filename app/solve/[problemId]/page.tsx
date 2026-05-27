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
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Send,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Clock,
  Target,
  MessageSquare,
  CalendarDays,
  X,
  Pencil,
  Trash2,
  ListOrdered
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

interface ReviewSummary {
  avgDifficulty: number | null
  avgTimeSeconds: number | null
  topTags: string[]
}

interface Review {
  writerName: string
  difficulty: number
  timeTakenSeconds: number
  comment: string
  tags: string[]
  updatedAt: string
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
  const [failCount, setFailCount] = useState(0)
  
  const [leftPaneWidth, setLeftPaneWidth] = useState(60)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 🚀 Review & Evaluation State
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [othersReviews, setOthersReviews] = useState<Review[]>([])
  const [isEditingReview, setIsEditingReview] = useState(false)

  // Review Form State
  const [reviewDiff, setReviewDiff] = useState(50)
  const [reviewMin, setReviewMin] = useState<number | "">("")
  const [reviewSec, setReviewSec] = useState<number | "">("")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewTags, setReviewTags] = useState<string[]>([])
  
  // Tag Autocomplete
  const [tagInput, setTagInput] = useState("")
  const [tagSuggestions, setTagSuggestions] = useState<{ id: number; name: string; description?: string }[]>([])

  useEffect(() => {
    if (!problemId) {
      alert("잘못된 접근입니다.")
      router.push("/groups")
      return
    }

    const initData = async () => {
      try {
        const userRes = await fetch("/api/users/me")
        const loggedIn = userRes.ok
        setIsLoggedIn(loggedIn)

        const pRes = await fetch(`/api/problems/${problemId}`)
        if (!pRes.ok) throw new Error("문제를 불러오지 못했습니다.")
        const pData = await pRes.json()
        setProblem(pData)

        // 🚀 기존 풀이 상태 체크 (이미 맞힌 문제면 바로 평가 창 노출)
        if (loggedIn) {
          const sRes = await fetch(`/api/submissions/status/${problemId}`)
          if (sRes.ok) {
            const sData = await sRes.json()
            setFailCount(sData.failCount || 0)
            if (sData.status === "정답") {
              setIsSubmitted(true)
              setIsCorrect(true)
              loadReviewDashboard()
            }
          }
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [problemId, router])

  // Split Pane Handlers
  const handleMouseDown = () => {
    setIsDragging(true)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return
    let newWidthPercent = (e.clientX / window.innerWidth) * 100
    if (newWidthPercent < 30) newWidthPercent = 30
    if (newWidthPercent > 80) newWidthPercent = 80
    setLeftPaneWidth(newWidthPercent)
  }, [isDragging])
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

  // Answer Submission
  const submitAnswer = async () => {
    if (!problem) return
    if (!userAnswer) {
      alert(problem.type === "MULTIPLE_CHOICE" ? "정답을 선택해주세요!" : "정답을 입력해주세요!")
      return
    }

    if (!isLoggedIn) {
      // 비로그인 시 단순 로컬 채점
      const correct = userAnswer === problem.answer
      setIsCorrect(correct)
      setIsSubmitted(true)
      return
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, answer: userAnswer }),
      })
      const result = await res.json()
      
      if (result.isCorrect) {
        setIsCorrect(true)
        setIsSubmitted(true)
        loadReviewDashboard()
      } else {
        setFailCount(prev => prev + 1)
        alert(`❌ 틀렸습니다! (누적 오답: ${failCount + 1}회)`)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 🚀 Review Dashboard Data Loading
  const loadReviewDashboard = async () => {
    try {
      const sumRes = await fetch(`/api/problems/${problemId}/reviews/summary`)
      if (sumRes.ok) setSummary(await sumRes.json())

      const meRes = await fetch(`/api/problems/${problemId}/reviews/me`)
      if (meRes.ok && meRes.status !== 204) {
        const myData: Review = await meRes.json()
        setMyReview(myData)
        setIsEditingReview(false)
        
        // Populate form data
        setReviewDiff(myData.difficulty)
        setReviewMin(Math.floor(myData.timeTakenSeconds / 60))
        setReviewSec(myData.timeTakenSeconds % 60)
        setReviewComment(myData.comment)
        setReviewTags(myData.tags)
      } else {
        setIsEditingReview(true) // 내 리뷰가 없으면 폼 열기
      }

      const othersRes = await fetch(`/api/problems/${problemId}/reviews`)
      if (othersRes.ok) setOthersReviews(await othersRes.json())

    } catch (e) {
      console.error("리뷰 API 호출 오류", e)
    }
  }

  // Review Form Actions
  const saveReview = async () => {
    const totalSeconds = (Number(reviewMin) || 0) * 60 + (Number(reviewSec) || 0)
    try {
      const res = await fetch("/api/submissions/review", {
        method: myReview ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          difficulty: reviewDiff,
          timeTakenSeconds: totalSeconds,
          comment: reviewComment,
          tags: reviewTags
        })
      })
      if (!res.ok) {
        const err = await res.text()
        alert("평가 저장 실패: " + err)
        return
      }
      loadReviewDashboard()
    } catch (e) {
      console.error(e)
    }
  }

  const deleteReview = async () => {
    if (!confirm("정말 이 평가를 삭제하시겠습니까?")) return
    try {
      await fetch(`/api/submissions/review?problemId=${problemId}`, { method: "DELETE" })
      alert("삭제되었습니다.")
      setMyReview(null)
      setIsEditingReview(true)
      setReviewDiff(50)
      setReviewMin("")
      setReviewSec("")
      setReviewComment("")
      setReviewTags([])
      loadReviewDashboard()
    } catch (e) {
      console.error(e)
    }
  }

  // Tag Management
  const searchTags = async (query: string) => {
    setTagInput(query)
    if (!query.trim()) {
      setTagSuggestions([])
      return
    }
    try {
      const res = await fetch(`/api/tags/search?query=${encodeURIComponent(query)}`)
      setTagSuggestions(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  const addTag = (name: string) => {
    if (!reviewTags.includes(name)) setReviewTags([...reviewTags, name])
    setTagInput("")
    setTagSuggestions([])
  }

  const removeTag = (name: string) => {
    setReviewTags(reviewTags.filter(t => t !== name))
  }

  // Helper Formatter
  const getDiffText = (val: number) => {
    if (val < 20) return `${val}명 (매우 어려움)`
    if (val < 40) return `${val}명 (어려움)`
    if (val < 60) return `${val}명 (보통)`
    if (val < 80) return `${val}명 (쉬움)`
    return `${val}명 (매우 쉬움)`
  }
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}분 ${secs % 60}초`
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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

  const choices = problem.type === "MULTIPLE_CHOICE" && problem.choices
    ? (() => { try { return JSON.parse(problem.choices) as string[] } catch { return [] } })() : []

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Pane - Problem Viewer */}
      <div className="bg-card border-r border-border flex flex-col overflow-hidden" style={{ width: `${leftPaneWidth}%` }}>
        {problem.pdfUrl ? (
          <iframe src={problem.pdfUrl} className="w-full h-full border-none" title="PDF Viewer" />
        ) : (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 mb-6 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-bold">문제 내용</span>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                  {problem.content || "문제 내용이 없습니다."}
                </p>
              </div>
              {problem.imageUrl && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-bold">첨부 이미지</span>
                  </div>
                  <img src={problem.imageUrl} alt="문제 첨부 이미지" className="rounded-lg border border-border max-w-full" />
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

      {/* Right Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-8 flex-1 max-w-3xl mx-auto w-full">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> 이전 화면으로
          </button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-3">{problem.title}</h1>
            <Badge variant="secondary" className="text-sm mb-4">{problem.sourcePath || "일반 문제"}</Badge>
            <div className={`p-3 rounded-lg text-sm font-bold border flex items-center justify-between transition-colors ${isCorrect ? "bg-green-500/10 border-green-500/30 text-green-600" : failCount > 0 ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-secondary border-border text-foreground"}`}>
              <span>현재 상태: {isCorrect ? "정답" : failCount > 0 ? "오답" : "풀이 전"}</span>
              <span className="opacity-80">누적 시도: {failCount}회</span>
            </div>
          </div>

          {!isSubmitted || !isCorrect ? (
            // 📝 정답 제출 폼
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" /> 정답 입력
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {problem.type === "MULTIPLE_CHOICE" && choices.length > 0 ? (
                  <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                    <div className="space-y-3">
                      {choices.map((choice, index) => (
                        <Label
                          key={index}
                          htmlFor={`choice-${index}`}
                          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-secondary/20 cursor-pointer hover:bg-secondary/60 hover:border-primary/50 transition-all [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/10"
                        >
                          <RadioGroupItem value={String(index + 1)} id={`choice-${index}`} className="border-muted-foreground" />
                          <span className="text-foreground">{circleNumbers[index] || `(${index + 1})`} {choice}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="space-y-3">
                    <Label htmlFor="answer" className="text-muted-foreground">답안 작성</Label>
                    <Input
                      id="answer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="정답을 입력하세요"
                      className="bg-input border-border text-lg py-6 px-4"
                    />
                  </div>
                )}
                <Button onClick={submitAnswer} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 font-bold text-base">
                  제출 및 채점하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            // 📊 학습 마무리 및 평가 대시보드
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-green-500/10 border border-green-500/30 text-green-600 p-4 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                ✅ 정답입니다! 문제에 대한 평가를 남겨주세요.
              </div>

              {/* Summary Stats */}
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" /> 종합 통계
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-secondary/40 border border-border rounded-xl p-4 text-center flex flex-col justify-center items-center h-24">
                    <span className="text-xs font-bold text-muted-foreground mb-1">평균 예상 정답률</span>
                    <span className="text-xl font-extrabold text-foreground">
                      {summary?.avgDifficulty ? `${Math.round(summary.avgDifficulty)}%` : "정보 없음"}
                    </span>
                  </div>
                  <div className="bg-secondary/40 border border-border rounded-xl p-4 text-center flex flex-col justify-center items-center h-24">
                    <span className="text-xs font-bold text-muted-foreground mb-1">평균 소요 시간</span>
                    <span className="text-xl font-extrabold text-foreground">
                      {summary?.avgTimeSeconds ? formatTime(summary.avgTimeSeconds) : "정보 없음"}
                    </span>
                  </div>
                </div>
                <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-center gap-4">
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">대표 태그</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {summary?.topTags && summary.topTags.length > 0 ? (
                      summary.topTags.map(t => (
                        <Badge key={t} variant="secondary" className="bg-background border-border text-foreground shadow-sm">#{t}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">대표 태그가 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              {/* My Review Section */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <Pencil className="h-5 w-5 text-primary" /> 나의 평가
                </h3>

                {!isEditingReview && myReview ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20">내 의견</Badge>
                        <span className="font-bold text-foreground">{myReview.writerName || "나"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(myReview.updatedAt)}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4 bg-secondary/30 p-3 rounded-lg w-fit">
                      <span className="font-medium flex items-center gap-1.5"><Target className="w-4 h-4"/> 정답률: {myReview.difficulty}%</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="font-medium flex items-center gap-1.5"><Clock className="w-4 h-4"/> 시간: {formatTime(myReview.timeTakenSeconds)}</span>
                    </div>
                    <p className="text-foreground leading-relaxed bg-background border border-border p-4 rounded-lg min-h-[80px]">
                      {myReview.comment || "작성된 코멘트가 없습니다."}
                    </p>
                    <div className="flex gap-2 flex-wrap pt-2">
                      {myReview.tags.map(t => <Badge key={t} variant="outline" className="bg-secondary/50">#{t}</Badge>)}
                    </div>
                    <Button variant="outline" className="mt-6 w-full gap-2 font-bold" onClick={() => setIsEditingReview(true)}>
                      <Pencil className="h-4 w-4" /> 의견 수정
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="space-y-3">
                      <Label className="text-foreground font-bold">예상 정답률 (100명 중 몇 명이 풀 수 있을까요?)</Label>
                      <div className="flex items-center gap-4 bg-secondary/20 p-4 rounded-lg border border-border">
                        <input
                          type="range" min="0" max="100"
                          value={reviewDiff}
                          onChange={(e) => setReviewDiff(Number(e.target.value))}
                          className="flex-1 accent-primary"
                        />
                        <span className="font-bold text-primary min-w-[120px] text-right">{getDiffText(reviewDiff)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-foreground font-bold">소요 시간</Label>
                      <div className="flex items-center gap-3">
                        <Input type="number" min="0" placeholder="0" value={reviewMin} onChange={e => setReviewMin(Number(e.target.value))} className="w-24 text-center" />
                        <span className="text-muted-foreground font-medium">분</span>
                        <Input type="number" min="0" max="59" placeholder="0" value={reviewSec} onChange={e => setReviewSec(Number(e.target.value))} className="w-24 text-center" />
                        <span className="text-muted-foreground font-medium">초</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-foreground font-bold">태그 (이 문제의 특징을 분류해주세요)</Label>
                      <div className="relative border border-border rounded-lg p-3 bg-background">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {reviewTags.map(t => (
                            <Badge key={t} variant="secondary" className="gap-1 px-2.5 py-1">
                              #{t} <button onClick={() => removeTag(t)} className="ml-1 hover:text-destructive"><X className="h-3 w-3"/></button>
                            </Badge>
                          ))}
                        </div>
                        <Input
                          value={tagInput}
                          onChange={e => searchTags(e.target.value)}
                          placeholder="태그 검색 후 추가"
                          className="border-none shadow-none focus-visible:ring-0 px-1"
                        />
                        {tagSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 w-full z-10 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {tagSuggestions.map((tag) => (
                              <button key={tag.id} onClick={() => addTag(tag.name)} className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0">
                                <span className="font-bold text-foreground">#{tag.name}</span>
                                {tag.description && <span className="text-xs text-muted-foreground ml-2 block mt-0.5">{tag.description}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-foreground font-bold">코멘트</Label>
                      <Textarea
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="풀이나 다른 사람을 위한 팁을 남겨보세요..."
                        className="min-h-[120px] bg-secondary/10"
                      />
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex gap-3">
                        <Button onClick={saveReview} className="flex-2 w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                          평가 저장하기
                        </Button>
                        {myReview && (
                          <Button variant="outline" onClick={() => setIsEditingReview(false)} className="flex-1 font-bold">취소</Button>
                        )}
                      </div>
                      {myReview && (
                        <Button variant="ghost" onClick={deleteReview} className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full mt-2">
                          내 평가 삭제하기
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Others' Reviews */}
              <div className="pt-8 border-t-2 border-dashed border-border/60">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <MessageSquare className="h-5 w-5 text-primary" /> 다른 사람들의 평가
                </h3>
                {othersReviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 bg-secondary/30 rounded-xl border border-border">아직 다른 사람의 평가가 없습니다.</p>
                ) : (
                  <div className="space-y-4">
                    {othersReviews.map((r, idx) => (
                      <Card key={idx} className="bg-card border-border shadow-sm hover:border-primary/30 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-foreground">{r.writerName || "익명"}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays className="w-3 h-3"/> {formatDate(r.updatedAt)}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground mb-4 bg-secondary/40 p-2.5 rounded-lg w-fit">
                            <span className="font-semibold text-primary">예상 정답률 {r.difficulty}%</span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="font-semibold text-emerald-600">소요 시간 {formatTime(r.timeTakenSeconds)}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed mb-4">
                            {r.comment || "코멘트가 없습니다."}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {r.tags.map(t => <Badge key={t} variant="secondary" className="bg-background border-border shadow-sm text-xs px-2 py-0.5">#{t}</Badge>)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/search" className="block mt-12">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-6 text-lg font-bold shadow-md">
                  다음 문제 탐색 <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
