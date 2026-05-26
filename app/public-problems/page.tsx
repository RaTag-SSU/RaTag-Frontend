"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Globe, Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp, LayoutList, LayoutGrid } from "lucide-react"

interface Problem {
  id: number
  title: string
  content: string
  sourcePath: string
  type: "SHORT_ANSWER" | "MULTIPLE_CHOICE"
  choices: string | null
  answer: string
  userStatus?: string
  topTags?: string[]
  avgDifficulty?: number | null
  imageUrl?: string
  pdfUrl?: string
}

export default function PublicProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("ROLE_USER")
  
  // 페이징 및 배열/태그 토글 상태 관리
  const [page, setPage] = useState(0)
  const pageSize = 100
  const [isLastPage, setIsLastPage] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list") // 🚀 1열(list) / 3열(grid) 토글 상태
  const [expandedTags, setExpandedTags] = useState<Record<number, boolean>>({}) // 🚀 카드별 태그 토글 상태

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<"CREATE" | "UPDATE">("CREATE")
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    sourcePath: "",
    content: "",
    type: "SHORT_ANSWER",
    choices: ["", "", "", "", ""],
    answer: "",
    uploadMode: "BLOG",
    pdfType: "FILE",
    pdfUrl: "",
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : { role: "ROLE_USER" }))
      .then((user) => {
        setUserRole(user.role)
        loadProblems(0, false)
      })
      .catch(() => loadProblems(0, false))
  }, [])

  const loadProblems = async (currentPage = 0, isAppend = false) => {
    setLoading(!isAppend)
    try {
      const res = await fetch("/api/problems/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: currentPage,
          size: pageSize,
          sortOrder: "ASC" 
        })
      })
      const data = await res.json()

      if (res.ok) {
        if (isAppend) {
          setProblems(prev => [...prev, ...data])
        } else {
          setProblems(data)
        }
        setIsLastPage(data.length < pageSize)
      }
    } catch (err) {
      console.error("목록 로드 에러:", err)
    } finaly {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadProblems(nextPage, true)
  }

  // 개별 태그 보기/숨기기 토글 함수
  const toggleTagVisibility = (id: number) => {
    setExpandedTags(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const openCreateForm = () => {
    setMode("CREATE")
    setEditingProblem(null)
    setFormData({ 
      title: "", sourcePath: "", content: "", type: "SHORT_ANSWER", 
      choices: ["", "", "", "", ""], answer: "", uploadMode: "BLOG", pdfType: "FILE", pdfUrl: "" 
    })
    setImageFile(null)
    setPdfFile(null)
    setIsDialogOpen(true)
  }

  const openUpdateForm = async (problem: Problem) => {
    setMode("UPDATE")
    setEditingProblem(problem)
    
    const res = await fetch(`/api/problems/${problem.id}`)
    const p = await res.json()
    
    let parsedChoices = ["", "", "", "", ""]
    try {
      if (p.choices) parsedChoices = JSON.parse(p.choices)
    } catch (e) {}

    setFormData({
      title: p.title || "",
      sourcePath: p.sourcePath || "",
      content: p.content || "",
      type: p.type || "SHORT_ANSWER",
      choices: parsedChoices,
      answer: p.answer || "",
      uploadMode: p.pdfUrl ? "PDF" : "BLOG",
      pdfType: p.pdfUrl && p.pdfUrl.startsWith("http") ? "URL" : "FILE",
      pdfUrl: p.pdfUrl && p.pdfUrl.startsWith("http") ? p.pdfUrl : "",
    })
    setImageFile(null)
    setPdfFile(null)
    setIsDialogOpen(true)
  }

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...formData.choices]
    newChoices[index] = value
    setFormData({ ...formData, choices: newChoices })
  }

  const handleSubmit = async () => {
    const fd = new FormData()
    fd.append("uploadMode", formData.uploadMode)
    fd.append("title", formData.title)
    fd.append("sourcePath", formData.sourcePath)
    fd.append("type", formData.type)
    fd.append("answer", formData.answer)

    if (formData.uploadMode === "BLOG") {
      fd.append("content", formData.content)
      if (imageFile) fd.append("imageFile", imageFile)
    } else {
      if (formData.pdfType === "FILE" && pdfFile) {
        fd.append("pdfFile", pdfFile)
      } else {
        fd.append("pdfUrl", formData.pdfUrl)
      }
    }

    if (formData.type === "MULTIPLE_CHOICE") {
      fd.append("choices", JSON.stringify(formData.choices))
    }

    const url = mode === "CREATE" ? "/api/problems" : `/api/problems/${editingProblem?.id}`
    const res = await fetch(url, { method: "POST", body: fd })

    if (res.ok) {
      alert("저장되었습니다.")
      setIsDialogOpen(false)
      setPage(0)
      loadProblems(0, false)
    } else {
      const msg = await res.text()
      alert("저장 실패: " + msg)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return
    const res = await fetch(`/api/problems/${id}`, { method: "DELETE" })
    if (res.ok) {
      alert("삭제되었습니다.")
      setPage(0)
      loadProblems(0, false)
    } else {
      const msg = await res.text()
      alert("삭제 실패: " + msg)
    }
  }

  const isAdmin = userRole === "ROLE_ADMIN"

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">공개 문제</h1>
              <p className="text-sm text-muted-foreground">모든 사용자가 풀 수 있는 문제들</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* 🚀 1열 / 3열 레이아웃 배치 전환 토글 버튼 */}
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/50">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4 mr-1.5" />
                목록형 (1열)
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                바둑판형 (3열)
              </Button>
            </div>

            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateForm} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9">
                    <Plus className="mr-1.5 h-4 w-4" />
                    새 문제 등록
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{mode === "CREATE" ? "문제 등록" : "문제 수정"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex gap-2 p-1 bg-secondary rounded-lg">
                      <Button 
                        variant={formData.uploadMode === "BLOG" ? "default" : "ghost"} 
                        className="flex-1" 
                        onClick={() => setFormData({...formData, uploadMode: "BLOG"})}
                      >📝 블로그형</Button>
                      <Button 
                        variant={formData.uploadMode === "PDF" ? "default" : "ghost"} 
                        className="flex-1"
                        onClick={() => setFormData({...formData, uploadMode: "PDF"})}
                      >📄 PDF형</Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>제목 *</Label>
                        <Input
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="제목을 입력하세요"
                          className="bg-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>경로/출처 (선택)</Label>
                        <Input
                          value={formData.sourcePath}
                          onChange={(e) => setFormData({ ...formData, sourcePath: e.target.value })}
                          placeholder="예: 2024학년도 수능"
                          className="bg-input"
                        />
                      </div>
                    </div>

                    {formData.uploadMode === "BLOG" ? (
                      <>
                        <div className="space-y-2">
                          <Label>이미지 첨부</Label>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="bg-input cursor-pointer" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>본문 내용 *</Label>
                          <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="지문을 입력하세요..."
                            className="bg-input min-h-[150px]"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="pdfType" checked={formData.pdfType === "FILE"} onChange={() => setFormData({...formData, pdfType: "FILE"})} />
                            <span className="text-sm">파일 업로드</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="pdfType" checked={formData.pdfType === "URL"} onChange={() => setFormData({...formData, pdfType: "URL"})} />
                            <span className="text-sm">외부 URL</span>
                          </label>
                        </div>
                        {formData.pdfType === "FILE" ? (
                           <Input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="bg-input cursor-pointer" />
                        ) : (
                           <Input value={formData.pdfUrl} onChange={(e) => setFormData({...formData, pdfUrl: e.target.value})} placeholder="https://..." className="bg-input" />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>유형 *</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: "SHORT_ANSWER" | "MULTIPLE_CHOICE") => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger className="bg-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SHORT_ANSWER">주관식</SelectItem>
                            <SelectItem value="MULTIPLE_CHOICE">객관식</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>정답 *</Label>
                        {formData.type === "MULTIPLE_CHOICE" ? (
                          <Select value={formData.answer} onValueChange={(val) => setFormData({...formData, answer: val})}>
                            <SelectTrigger className="bg-input"><SelectValue placeholder="정답 선택" /></SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}번</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={formData.answer}
                            onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                            placeholder="정답"
                            className="bg-input"
                          />
                        )}
                      </div>
                    </div>

                    {formData.type === "MULTIPLE_CHOICE" && (
                      <div className="space-y-3 p-4 border rounded-lg bg-secondary/20">
                        <Label>보기 항목</Label>
                        {formData.choices.map((choice, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="font-bold text-primary w-6 text-center">{i+1}</span>
                            <Input
                              value={choice}
                              onChange={(e) => updateChoice(i, e.target.value)}
                              placeholder={`${i+1}번 보기 내용`}
                              className="bg-input"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">저장하기</Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">취소</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Problem List */}
        {loading && page === 0 ? (
          <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardHeader><div className="h-5 bg-secondary rounded w-3/4" /></CardHeader>
                <CardContent><div className="h-4 bg-secondary rounded w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : problems.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">등록된 공개 문제가 없습니다</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 🚀 viewMode 값에 따라 한 줄에 1개(list) 또는 3개(grid) 유연하게 조절 */}
            <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {problems.map((problem) => {
                const isTagsExpanded = !!expandedTags[problem.id];
                
                return (
                  <Card
                    key={problem.id}
                    className="bg-card border-border hover:border-primary/40 transition-all flex flex-col justify-between"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 bg-secondary/60 font-bold">
                            {problem.id}번
                          </Badge>
                          
                          {/* 🚀 1. 제목 클릭 시 풀이창 이동 하이퍼링크 처리 */}
                          <Link href={`/solve/${problem.id}`} className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1">
                            {problem.title}
                          </Link>

                          {/* 🚀 3. 주관식/객관식 뱃지 오류 수정 및 제목 바로 우측 배치 */}
                          <Badge variant="outline" className="text-xs font-semibold text-primary/80 border-primary/20 px-2 py-0">
                            {problem.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                          </Badge>
                        </div>
                        
                        {/* 성공/실패 여부 상단 우측 고정 */}
                        <div className="shrink-0">
                          {problem.userStatus === '성공' && <Badge className="bg-emerald-500 hover:bg-emerald-600">성공</Badge>}
                          {problem.userStatus === '실패' && <Badge variant="destructive">실패</Badge>}
                        </div>
                      </div>

                      {/* 🚀 4. 기존 경로(sourcePath) 배지 노출 완전 삭제 */}
                    </CardHeader>
                    
                    <CardContent className="flex-1 pb-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {problem.content}
                      </p>

                      {/* 🚀 2. 태그 숨김 기능 및 토글 인터페이스 완벽 복구 */}
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleTagVisibility(problem.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-bold p-0 border-none bg-transparent cursor-pointer transition-colors"
                        >
                          {isTagsExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              <span>태그 숨기기</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              <span>태그 보기</span>
                            </>
                          )}
                        </button>

                        {isTagsExpanded && (
                          <div className="pt-1.5 border-t border-dashed border-border/60">
                            {problem.topTags && problem.topTags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {problem.topTags.map(tag => (
                                  <span key={tag} className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[12px] text-muted-foreground italic">등록된 태그가 없습니다.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 flex items-center justify-between border-t border-border/40 bg-muted/10 px-6 py-2.5 mt-2">
                      {/* 평균 정답률 통계 매칭 */}
                      <div>
                        {problem.avgDifficulty ? (
                          <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            평균 정답률 {problem.avgDifficulty}%
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">데이터 없음</span>
                        )}
                      </div>

                      {/* 어드민 전용 제어 및 관리 도구 */}
                      {isAdmin && (
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" onClick={() => openUpdateForm(problem)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(problem.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
            
            {/* 페이징 무한 스크롤 더보기 액션 */}
            {!isLastPage && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={handleLoadMore} className="w-full max-w-sm py-5 font-bold shadow-sm">
                  <ChevronDown className="mr-1.5 h-4 w-4" /> 문제 더보기
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
