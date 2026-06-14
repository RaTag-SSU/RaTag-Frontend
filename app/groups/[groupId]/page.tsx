"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { apiFetch, parseErrorMessage } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  BookOpen,
  Users,
  Plus,
  Pencil,
  Trash2,
  Crown,
  UserCheck,
  UserX,
  LogOut,
  Clock,
  ChevronDown,
  ChevronUp,
  LayoutList,
  LayoutGrid
} from "lucide-react"

interface Group {
  id: number
  name: string
  description: string
  role: "ADMIN" | "MEMBER" | "PENDING" | "NONE"
}

interface Problem {
  id: number
  title: string
  content: string
  sourcePath?: string
  type: "SHORT_ANSWER" | "MULTIPLE_CHOICE"
  choices: string | null
  answer: string
  userStatus?: string
  topTags?: string[]
  avgDifficulty?: number | null
  imageUrl?: string
  pdfUrl?: string
}

interface Member {
  userId: number
  name: string
  role: "ADMIN" | "MEMBER" | "PENDING"
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.groupId as string

  const [isAuthorized, setIsAuthorized] = useState(false)
  const [group, setGroup] = useState<Group | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isSiteAdmin, setIsSiteAdmin] = useState(false)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<"CREATE" | "UPDATE">("CREATE")
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set())

  // 🚀 공개 문제 페이지와 동일하게 폼 데이터 확장
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
  
  // 🚀 파일 업로드용 상태 추가
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  useEffect(() => {
    if (!groupId) return

    const load = async () => {
      try {
        const authRes = await apiFetch("/api/users/me")
        const user = await authRes.json()
        const isAdmin = user.role === "ROLE_ADMIN"
        setIsSiteAdmin(isAdmin)
        setIsAuthorized(true)
        loadGroupData(isAdmin)
      } catch (e) {
        console.error("초기화 에러:", e)
      }
    }

    load()
  }, [groupId, router])

  const loadGroupData = (isAdminStatus: boolean) => {
    apiFetch("/api/groups")
      .then((res) => res.json())
      .then((groups: Group[]) => {
        const foundGroup = groups.find((g) => g.id === Number(groupId))
        if (!foundGroup) {
          alert("접근할 수 없는 그룹입니다.")
          router.push("/groups")
          return
        }
        setGroup(foundGroup)
        if (foundGroup.role === "MEMBER" || foundGroup.role === "ADMIN" || isAdminStatus) {
          loadProblems()
          loadMembers()
        }
        setLoading(false)
      })
  }

  const loadProblems = async () => {
    try {
      const res = await apiFetch("/api/problems/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(groupId),
          page: 0,
          size: 100
        }),
        cache: "no-store",
        credentials: "include"
      })
      if (res.ok) {
        const data = await res.json()
        setProblems(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadMembers = async () => {
    const res = await apiFetch(`/api/groups/${groupId}/members`)
    if (res.ok) setMembers(await res.json())
  }

  const toggleTags = (id: number) => {
    setExpandedTags((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 🚀 공개 문제 폼 로직 이식
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

  // 🚀 공개 문제 폼 로직 이식 (기존 데이터 불러오기)
  const openUpdateForm = async (problemId: number) => {
    const res = await apiFetch(`/api/problems/${problemId}`, { cache: "no-store", credentials: "include" })
    const p = await res.json()
    setMode("UPDATE")
    setEditingProblem(p)
    
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

  // 🚀 JSON 제출에서 FormData 제출(파일 포함)로 이식
  const handleSubmit = async () => {
    if (!formData.title || !formData.answer) {
      alert("제목과 정답은 필수입니다!")
      return
    }

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

    const url = mode === "CREATE" ? `/api/problems?groupId=${groupId}` : `/api/problems/${editingProblem?.id}`
    const res = await apiFetch(url, { method: "POST", body: fd, credentials: "include" })

    if (res.ok) {
      alert("저장되었습니다.")
      setIsDialogOpen(false)
      loadProblems()
    } else {
      const msg = await parseErrorMessage(res)
      alert("저장 실패: " + msg)
    }
  }

  const deleteProblem = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.")) return
    const res = await apiFetch(`/api/problems/${id}`, { method: "DELETE", credentials: "include" })
    if (res.ok) loadProblems()
    else alert("삭제 실패")
  }

  const manageMember = async (userId: number, action: "approve" | "kick") => {
    const res = await apiFetch(`/api/groups/${groupId}/${action}/${userId}`, { method: "POST", credentials: "include" })
    if (res.ok) loadMembers()
    else alert("처리 실패")
  }

  const leaveGroup = async () => {
    if (!confirm("정말 이 그룹에서 탈퇴하시겠습니까?")) return
    const res = await apiFetch(`/api/groups/${groupId}/leave`, { method: "DELETE", credentials: "include" })
    if (res.ok) {
      alert("그룹에서 정상적으로 탈퇴했습니다.")
      router.push("/groups")
    } else {
      const msg = await parseErrorMessage(res)
      alert("탈퇴 실패: " + msg)
    }
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-bold">권한을 확인하는 중입니다...</p>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/4" />
            <div className="h-4 bg-secondary rounded w-1/2" />
          </div>
        </main>
      </div>
    )
  }

  if (!group) return null

  const isGroupAdmin = group.role === "ADMIN"
  const hasAdminAccess = isGroupAdmin || isSiteAdmin
  const canViewContent = group.role === "MEMBER" || group.role === "ADMIN" || isSiteAdmin

  const pendingMembers = members.filter((m) => m.role === "PENDING")
  const activeMembers = members.filter((m) => m.role !== "PENDING")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <Link
            href="/groups"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            로비로 돌아가기
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{group.name}</h1>
              <p className="text-muted-foreground">{group.description || "설명이 없습니다"}</p>
            </div>
            {group.role === "MEMBER" && (
              <Button
                variant="outline"
                onClick={leaveGroup}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                그룹 탈퇴
              </Button>
            )}
          </div>
        </div>

        {group.role === "PENDING" && (
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="h-16 w-16 text-warning mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">가입 승인을 대기 중입니다</h2>
              <p className="text-muted-foreground">승인이 완료되어야 내용을 확인할 수 있습니다.</p>
            </CardContent>
          </Card>
        )}

        {canViewContent && (
          <Tabs defaultValue="problems" className="w-full">
            <TabsList className="w-full max-w-md bg-secondary border border-border">
              <TabsTrigger
                value="problems"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                문제집
              </TabsTrigger>
              <TabsTrigger
                value="members"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="mr-2 h-4 w-4" />
                멤버 관리
              </TabsTrigger>
            </TabsList>

            {/* Problems Tab */}
            <TabsContent value="problems" className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {hasAdminAccess ? (
                  <Button
                    onClick={openCreateForm}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    새 문제 등록
                  </Button>
                ) : (
                  <div /> /* Flex spacing 유지용 */
                )}

                <div className="flex items-center border rounded-lg p-0.5 bg-muted/50 self-end sm:self-auto">
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
              </div>

              {problems.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">그룹에 등록된 문제가 없습니다</p>
                    {hasAdminAccess && <p className="text-sm text-muted-foreground">새 문제를 등록해 주세요</p>}
                  </CardContent>
                </Card>
              ) : (
                <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                  {problems.map((problem) => (
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
                            
                            <Link href={`/solve/${problem.id}`} className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-1">
                              {problem.title}
                            </Link>

                            {problem.type && (
                              <Badge variant="outline" className="text-xs font-semibold text-primary/80 border-primary/20 px-2 py-0">
                                {String(problem.type).toUpperCase() === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="shrink-0">
                            {problem.userStatus === '성공' && <Badge className="bg-emerald-500 hover:bg-emerald-600">성공</Badge>}
                            {problem.userStatus === '실패' && <Badge variant="destructive">실패</Badge>}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col pb-4">
                        {problem.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {problem.content}
                          </p>
                        )}

                        <div className="mt-auto pt-3 border-t border-border/40">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => toggleTags(problem.id)}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-bold p-0 border-none bg-transparent cursor-pointer transition-colors"
                            >
                              {expandedTags.has(problem.id) ? (
                                <><ChevronUp className="w-3.5 h-3.5 text-slate-400" /><span>태그 숨기기</span></>
                              ) : (
                                <><ChevronDown className="w-3.5 h-3.5 text-slate-400" /><span>태그 보기</span></>
                              )}
                            </button>

                            <div className="flex items-center gap-3">
                              {problem.avgDifficulty ? (
                                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                  정답률 {problem.avgDifficulty}%
                                </div>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">통계 없음</span>
                              )}

                              {hasAdminAccess && (
                                <div className="flex gap-0.5">
                                  <Button variant="ghost" size="icon" onClick={() => openUpdateForm(problem.id)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => deleteProblem(problem.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {expandedTags.has(problem.id) && (
                            <div className="pt-2 mt-2 border-t border-dashed border-border/60">
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
                    </Card>
                  ))}
                </div>
              )}

              {/* 🚀 공개 문제와 동일한 폼 구조 */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            </TabsContent>

            <TabsContent value="members" className="mt-6 space-y-6">
              {/* Pending Members */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-warning" />
                    가입 대기자
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">대기자가 없습니다</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingMembers.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                        >
                          <span className="font-medium text-foreground">{member.name}</span>
                          {isGroupAdmin && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => manageMember(member.userId, "approve")}
                                className="bg-success text-success-foreground hover:bg-success/90"
                              >
                                <UserCheck className="mr-1 h-3 w-3" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => manageMember(member.userId, "kick")}
                              >
                                <UserX className="mr-1 h-3 w-3" />
                                거절
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Active Members */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    그룹 멤버
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{member.name}</span>
                          {member.role === "ADMIN" && (
                            <Badge className="bg-destructive/20 text-destructive border-destructive/50">
                              <Crown className="mr-1 h-3 w-3" />
                              방장
                            </Badge>
                          )}
                        </div>
                        {isGroupAdmin && member.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => manageMember(member.userId, "kick")}
                          >
                            <UserX className="mr-1 h-3 w-3" />
                            강퇴
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
