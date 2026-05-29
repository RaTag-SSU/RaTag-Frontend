"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft, BookOpen, CheckCircle2, Send, FileText, Image as ImageIcon,
  MessageSquare, X, Pencil, Trash2
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

const circleNumbers = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]

export default function SolvePage() {
  const params = useParams()
  const router = useRouter()
  const problemId = params.problemId as string

  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  
  // 상태 및 풀이 기록
  const [status, setStatus] = useState("풀이 전")
  const [failCount, setFailCount] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [shakeAnim, setShakeAnim] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState("")

  // 레이아웃 리사이저
  const [leftPaneWidth, setLeftPaneWidth] = useState(60)
  const [isDragging, setIsDragging] = useState(false)

  // 평가 대시보드 상태
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [othersReviews, setOthersReviews] = useState<Review[]>([])
  const [isEditing, setIsEditing] = useState(false) // 보기 모드 / 수정 모드 토글

  // 폼 입력 상태
  const [reviewDiff, setReviewDiff] = useState(50)
  const [reviewMin, setReviewMin] = useState<number | "">("")
  const [reviewSec, setReviewSec] = useState<number | "">("")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewTags, setReviewTags] = useState<string[]>([])
  
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
        // 🚀 1. 인증 실패 시: 로딩 화면(true)을 유지한 채로 즉시 로그인 창으로 튕겨냅니다.
        const authRes = await fetch("/api/users/me")
        if (!authRes.ok) {
          alert("로그인이 필요한 서비스입니다.")
          router.push("/login")
          return 
        }

        // 🚀 2. 인증 통과 시: 정상적으로 문제 데이터와 상태를 불러옵니다.
        const [pRes, sRes] = await Promise.all([
          fetch(`/api/problems/${problemId}`),
          fetch(`/api/submissions/status/${problemId}`)
        ])

        if (pRes.ok) setProblem(await pRes.json())
        
        if (sRes.ok) {
          const sData = await sRes.json()
          setFailCount(sData.failCount || 0)
          setStatus(sData.status || "풀이 전")
          
          if (sData.status === "정답") {
            loadReviewDashboard()
          }
        }
        
        // 모든 세팅이 끝나면 화면을 보여줍니다.
        setLoading(false)

      } catch (error) {
        console.error(error)
        router.push("/login")
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

  // 정답 제출
  const submitAnswer = async () => {
    if (!userAnswer) {
      setFeedbackMsg("정답을 먼저 입력해주세요!")
      triggerShake()
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
        setStatus("정답")
        setFeedbackMsg("")
        loadReviewDashboard()
      } else {
        const newFailCount = failCount + 1
        setFailCount(newFailCount)
        setStatus("오답")
        setFeedbackMsg(`❌ 틀렸습니다! (누적 오답: ${newFailCount}회)`)
        triggerShake()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const triggerShake = () => {
    setShakeAnim(false)
    setTimeout(() => setShakeAnim(true), 10)
  }

  // 리뷰 대시보드 로드
  const loadReviewDashboard = async () => {
    try {
      const sumRes = await fetch(`/api/problems/${problemId}/reviews/summary`)
      if (sumRes.ok) setSummary(await sumRes.json())

      const meRes = await fetch(`/api/problems/${problemId}/reviews/me`)
      if (meRes.ok && meRes.status !== 204) {
        const myData: Review = await meRes.json()
        setMyReview(myData)
        setIsEditing(false) // 내 리뷰가 있으면 디스플레이 모드
        
        setReviewDiff(myData.difficulty)
        setReviewMin(Math.floor(myData.timeTakenSeconds / 60))
        setReviewSec(myData.timeTakenSeconds % 60)
        setReviewComment(myData.comment)
        setReviewTags(myData.tags)
      } else {
        setIsEditing(true) // 없으면 입력 폼 모드
      }

      const othersRes = await fetch(`/api/problems/${problemId}/reviews`)
      if (othersRes.ok) setOthersReviews(await othersRes.json())

    } catch (e) {
      console.error(e)
    }
  }

  // 평가 저장
  const saveEvaluation = async () => {
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
        alert("❌ 평가 저장 실패: " + err)
        return
      }
      loadReviewDashboard()
    } catch (e) {
      console.error(e)
    }
  }

  // 평가 삭제
  const deleteEvaluation = async () => {
    if (!confirm("정말 이 평가를 삭제하시겠습니까?")) return
    try {
      await fetch(`/api/submissions/review?problemId=${problemId}`, { method: "DELETE" })
      alert("삭제되었습니다.")
      window.location.reload()
    } catch (e) {
      console.error(e)
    }
  }

  // 태그 시스템
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

  // 유틸 함수
  const getDiffText = (val: number) => {
    if (val < 20) return `${val}명 (매우 어려움)`
    if (val < 40) return `${val}명 (어려움)`
    if (val < 60) return `${val}명 (보통)`
    if (val < 80) return `${val}명 (쉬움)`
    return `${val}명 (매우 쉬움)`
  }
  const formatTime = (secs: number) => `${Math.floor(secs / 60)}분 ${secs % 60}초`
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">권한을 확인하는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (!problem) return null

  const choices = problem.type === "MULTIPLE_CHOICE" && problem.choices
    ? (() => { try { return JSON.parse(problem.choices) as string[] } catch { return [] } })() : []

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Shake 애니메이션 CSS 주입 */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .shake-anim { animation: shake 0.4s ease-in-out; }
      `}</style>

      {/* Left Pane - Problem Viewer */}
      <div className="bg-card border-r border-border flex flex-col overflow-hidden" style={{ width: `${leftPaneWidth}%` }}>
        {problem.pdfUrl ? (
          <iframe 
            src={problem.pdfUrl} 
            className="w-full h-full border-none" 
            title="PDF Viewer"
            // 🚀 핵심 수정 부분: 드래그 중일 때는 마우스 이벤트를 무시하게 만듦
            style={{ pointerEvents: isDragging ? "none" : "auto" }} 
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-12">
            <div className="max-w-3xl mx-auto">
              {problem.imageUrl && (
                <img src={problem.imageUrl} alt="문제 첨부 이미지" className="rounded-xl border border-border max-w-full mx-auto mb-8 shadow-sm" />
              )}
              <div className="text-lg leading-relaxed text-foreground whitespace-pre-wrap bg-secondary/20 p-8 rounded-xl border border-border">
                {problem.content || "문제 내용이 없습니다."}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resizer */}
      <div
        className="w-2 bg-secondary hover:bg-primary cursor-col-resize flex items-center justify-center transition-colors z-10"
        onMouseDown={handleMouseDown}
      >
        <div className="text-muted-foreground/50 font-bold select-none">⋮</div>
      </div>

      {/* Right Pane */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-background">
        <div className="p-10 flex-1 max-w-3xl mx-auto w-full">
          <button onClick={() => router.back()} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> 이전 화면으로 돌아가기
          </button>

          <h2 className="text-2xl font-extrabold text-foreground mb-2">{problem.title || "제목 없음"}</h2>
          <Badge variant="secondary" className="text-xs mb-4 text-muted-foreground">{problem.sourcePath || "일반 문제"}</Badge>
          
          <div className={`p-3 rounded-lg text-sm font-bold border transition-colors mb-8 ${status === "정답" ? "bg-green-500/10 border-green-500/30 text-green-600" : status === "오답" ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-secondary border-border text-foreground"}`}>
            현재 상태: {status} | 오답 시도: {failCount}회
          </div>

          {/* 📝 정답 입력 영역 (정답이 아닐 때만 노출) */}
          {status !== "정답" && (
            <Card className={`bg-card border-border shadow-sm mb-6 transition-all ${shakeAnim ? "shake-anim bg-red-500/5 border-red-500/30" : ""}`}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 border-l-4 border-primary pl-3">
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
                          className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background cursor-pointer hover:bg-secondary/60 hover:border-border transition-all [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/10 [&:has(:checked)_span]:text-primary [&:has(:checked)_span]:font-bold"
                        >
                          <RadioGroupItem value={String(index + 1)} id={`choice-${index}`} className="border-muted-foreground w-5 h-5" />
                          <span className="text-foreground text-[15px]">{circleNumbers[index] || `(${index + 1})`} {choice}</span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <Input
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="정답을 입력하세요"
                    className={`bg-background border-2 border-border text-base py-6 px-4 focus-visible:ring-0 focus-visible:border-primary transition-colors ${shakeAnim ? "border-red-500 bg-red-50" : ""}`}
                  />
                )}
                
                {feedbackMsg && (
                  <div className="text-center text-sm font-bold text-destructive h-5">
                    {feedbackMsg}
                  </div>
                )}
                
                <Button onClick={submitAnswer} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 py-6 font-bold text-base transition-transform">
                  제출 및 채점하기
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 📊 평가 및 종합 정보 영역 (정답일 때만 노출) */}
          {status === "정답" && (
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 border-l-4 border-primary pl-3">
                  학습 마무리 및 평가
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 text-green-600 p-5 rounded-xl text-center font-bold text-base">
                  ✅ 정답입니다! 문제에 대한 정보를 남겨주세요.
                </div>

                {/* 문제 종합 데이터 */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-secondary/40 border border-border rounded-xl p-4 text-center">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">평균 예상 정답률</span>
                    <span className="text-lg font-extrabold text-foreground">
                      {summary?.avgDifficulty ? `${Math.round(summary.avgDifficulty)}%` : "로딩중"}
                    </span>
                  </div>
                  <div className="flex-1 bg-secondary/40 border border-border rounded-xl p-4 text-center">
                    <span className="text-xs font-bold text-muted-foreground block mb-1">평균 소요 시간</span>
                    <span className="text-lg font-extrabold text-foreground">
                      {summary?.avgTimeSeconds ? formatTime(summary.avgTimeSeconds) : "로딩중"}
                    </span>
                  </div>
                </div>
                
                <div className="bg-secondary/40 border border-border rounded-xl p-4 flex items-start gap-4">
                  <span className="text-xs font-bold text-muted-foreground mt-1.5 whitespace-nowrap">대표 태그</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    {summary?.topTags && summary.topTags.length > 0 ? (
                      summary.topTags.map(t => <Badge key={t} variant="secondary" className="bg-background">#{t}</Badge>)
                    ) : (
                      <span className="text-sm text-muted-foreground">아직 대표 태그가 없습니다.</span>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* 내 평가 보기 모드 */}
                {!isEditing && myReview && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge className="bg-primary text-white">내 의견</Badge>
                      <span className="font-bold text-foreground">{myReview.writerName || "사용자"}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground mb-4">
                      <span>예상 정답률: {myReview.difficulty}%</span>
                      <span>소요 시간: {formatTime(myReview.timeTakenSeconds)}</span>
                      <span className="ml-auto text-muted-foreground/70">{formatDateTime(myReview.updatedAt)}</span>
                    </div>
                    <div className="text-base text-foreground leading-relaxed mb-4">
                      {myReview.comment || "코멘트 내용"}
                    </div>
                    <div className="flex gap-2 flex-wrap mb-5">
                      {myReview.tags.map(t => <Badge key={t} variant="outline" className="bg-secondary/50">#{t}</Badge>)}
                    </div>
                    <Button variant="secondary" className="w-full gap-2 font-bold bg-secondary hover:bg-secondary/80" onClick={() => setIsEditing(true)}>
                      <Pencil className="h-4 w-4" /> 의견 수정
                    </Button>
                  </div>
                )}

                {/* 내 평가 입력/수정 폼 */}
                {isEditing && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="space-y-2">
                      <Label className="font-bold text-muted-foreground">예상 정답률 (100명 중 몇 명이 풀 수 있을까요?)</Label>
                      <div className="flex items-center gap-4">
                        <input type="range" min="0" max="100" value={reviewDiff} onChange={e => setReviewDiff(Number(e.target.value))} className="flex-1 accent-primary" />
                        <span className="font-bold text-primary min-w-[100px]">{getDiffText(reviewDiff)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-muted-foreground">소요 시간</Label>
                      <div className="flex items-center gap-3">
                        <Input type="number" min="0" placeholder="0" value={reviewMin} onChange={e => setReviewMin(Number(e.target.value))} className="w-20 text-center bg-background" />
                        <span className="text-sm">분</span>
                        <Input type="number" min="0" max="59" placeholder="0" value={reviewSec} onChange={e => setReviewSec(Number(e.target.value))} className="w-20 text-center bg-background" />
                        <span className="text-sm">초</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-muted-foreground">태그 검색 (이 문제의 특징을 분류해주세요)</Label>
                      <div className="relative">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {reviewTags.map(t => (
                            <Badge key={t} variant="secondary" className="gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50">
                              #{t} <button onClick={() => removeTag(t)} className="ml-1 hover:text-destructive"><X className="h-3.5 w-3.5"/></button>
                            </Badge>
                          ))}
                        </div>
                        <Input value={tagInput} onChange={e => searchTags(e.target.value)} placeholder="태그 검색" className="bg-background border-2" />
                        {tagSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 w-full z-10 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {tagSuggestions.map(tag => (
                              <button key={tag.id} onClick={() => addTag(tag.name)} className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border/50 last:border-0">
                                <span className="font-bold text-foreground">#{tag.name}</span>
                                {tag.description && <span className="text-xs text-muted-foreground block mt-0.5">{tag.description}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-muted-foreground">코멘트</Label>
                      <Textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="풀이나 다른 사람을 위한 팁을 남겨보세요..." className="min-h-[100px] bg-secondary/20 resize-none" />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <Button onClick={saveEvaluation} className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6">
                          평가 등록하기
                        </Button>
                        {myReview && (
                          <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1 font-bold py-6 bg-secondary hover:bg-secondary/80 text-muted-foreground">
                            취소
                          </Button>
                        )}
                      </div>
                      {myReview && (
                        <Button variant="destructive" onClick={deleteEvaluation} className="w-full py-6 font-bold">
                          내 평가 삭제하기
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 타인 평가 목록 */}
                <div className="pt-8 mt-10 border-t-2 border-dashed border-border">
                  <h4 className="font-bold text-foreground mb-4">다른 사람들의 평가</h4>
                  {othersReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">아직 다른 사람의 평가가 없습니다.</p>
                  ) : (
                    <div className="space-y-4">
                      {othersReviews.map((r, idx) => (
                        <div key={idx} className="bg-secondary/20 p-5 rounded-xl border border-border">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-extrabold text-foreground">{r.writerName || "익명"}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(r.updatedAt)}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-3">
                            예상정답률 {r.difficulty}% · 소요 시간 {Math.floor(r.timeTakenSeconds/60)}분 {r.timeTakenSeconds%60}초
                          </div>
                          <div className="text-[15px] text-foreground leading-relaxed mb-3">
                            {r.comment || "코멘트가 없습니다."}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {r.tags.map(t => <Badge key={t} variant="secondary" className="bg-secondary text-muted-foreground">#{t}</Badge>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
