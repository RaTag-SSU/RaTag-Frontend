"use client"

import { useEffect, useState, useRef } from "react"
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
import { Globe, Plus, Pencil, Trash2, BookOpen, ExternalLink, ChevronDown } from "lucide-react"

// HTML 기반으로 복구된 정확한 문제 인터페이스
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
  
  // 페이징 상태 복구
  const [page, setPage] = useState(0)
  const pageSize = 100
  const [isLastPage, setIsLastPage] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<"CREATE" | "UPDATE">("CREATE")
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  
  // HTML 폼 구조(파일 업로드, PDF 모드 등) 완벽 복구
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
  
  // 파일 상태 별도 관리
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

  // 기존 GET /api/problems 대신 POST /api/problems/search + 오름차순 정렬 로직 복구
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
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadProblems(nextPage, true)
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
    
    // 상세 정보(choices 등)를 가져오기 위해 단건 조회 로직 복구
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
    // JSON이 아닌 Multipart FormData 형식으로 변경 (파일 업로드 지원)
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
    
    // HTML 원본 로직에 따라 CREATE, UPDATE 모두 POST 사용 (Multipart 지원)
    const res = await fetch(url, {
      method: "POST",
      body: fd,
    })

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">공개 문제</h1>
              <p className="text-sm text-muted-foreground">모든 사용자가 풀 수 있는 문제들</p>
            </div>
          </div>
          
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateForm} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  새 문제 등록
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{mode === "CREATE" ? "문제 등록" : "문제 수정"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* 업로드 모드 선택 복구 */}
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

        {/* Problem List */}
        {loading && page === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardHeader><div className="h-5 bg-secondary rounded w-3/4" /></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-secondary rounded w-full" />
                    <div className="h-4 bg-secondary rounded w-2/3" />
                  </div>
                </CardContent>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {problems.map((problem) => (
                <Card
                  key={problem.id}
                  className="bg-card border-border hover:border-primary/50 transition-all flex flex-col"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 bg-secondary/50">
                          {problem.id}번
                        </Badge>
                        <CardTitle className="text-base font-semibold line-clamp-1">
                          {problem.title}
                        </CardTitle>
                      </div>
                      
                      {/* 상태 뱃지 (HTML 복구) */}
                      {problem.userStatus === '성공' && <Badge className="bg-emerald-500 hover:bg-emerald-600 shrink-0">성공</Badge>}
                      {problem.userStatus === '실패' && <Badge variant="destructive" className="shrink-0">실패</Badge>}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {problem.sourcePath && (
                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground border-dashed">
                          {problem.sourcePath}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs font-normal text-primary/70 border-primary/20">
                        {problem.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pb-4">
                    {/* 태그 영역 (HTML 복구) */}
                    {problem.topTags && problem.topTags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {problem.topTags.map(tag => (
                          <span key={tag} className="text-[11px] font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-muted-foreground italic mt-2">등록된 태그가 없습니다.</p>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 flex items-center justify-between border-t border-border/40 mt-auto bg-muted/20 px-6 py-3">
                    {/* 정답률 통계 (HTML 복구) */}
                    <div>
                      {problem.avgDifficulty ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                          <Globe className="w-3.5 h-3.5" />
                          평균 정답률 {problem.avgDifficulty}%
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">통계 없음</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openUpdateForm(problem)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(problem.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Link href={`/solve/${problem.id}`}>
                        <Button size="sm" className="h-8 text-xs">
                          풀이하기
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* 페이징 더보기 버튼 복구 */}
            {!isLastPage && (
              <div className="mt-8 flex justify-center">
                <Button variant="outline" onClick={handleLoadMore} className="w-full max-w-sm">
                  <ChevronDown className="mr-2 h-4 w-4" /> 문제 더보기
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
