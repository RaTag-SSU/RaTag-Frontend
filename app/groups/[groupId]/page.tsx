"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
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
  ExternalLink,
  LogOut,
  Clock,
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
  type: "SHORT_ANSWER" | "MULTIPLE_CHOICE"
  choices: string | null
  answer: string
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

  const [group, setGroup] = useState<Group | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isSiteAdmin, setIsSiteAdmin] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<"CREATE" | "UPDATE">("CREATE")
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "SHORT_ANSWER",
    choices: "",
    answer: "",
  })

  useEffect(() => {
    if (!groupId) return

    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : { role: "ROLE_USER" }))
      .then((user) => {
        setIsSiteAdmin(user.role === "ROLE_ADMIN")
        loadGroupData()
      })
      .catch(() => loadGroupData())
  }, [groupId])

  const loadGroupData = () => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((groups: Group[]) => {
        const foundGroup = groups.find((g) => g.id === Number(groupId))
        if (!foundGroup) {
          alert("접근할 수 없는 그룹입니다.")
          router.push("/groups")
          return
        }
        setGroup(foundGroup)
        if (foundGroup.role === "MEMBER" || foundGroup.role === "ADMIN" || isSiteAdmin) {
          loadProblems()
          loadMembers()
        }
        setLoading(false)
      })
  }

  const loadProblems = () => {
    fetch(`/api/groups/${groupId}/problems`)
      .then((res) => res.json())
      .then((data) => setProblems(data))
  }

  const loadMembers = () => {
    fetch(`/api/groups/${groupId}/members`)
      .then((res) => res.json())
      .then((data) => setMembers(data))
  }

  const openCreateForm = () => {
    setMode("CREATE")
    setEditingProblem(null)
    setFormData({ title: "", content: "", type: "SHORT_ANSWER", choices: "", answer: "" })
    setIsDialogOpen(true)
  }

  const openUpdateForm = async (problemId: number) => {
    const res = await fetch(`/api/problems/${problemId}`)
    const problem = await res.json()
    setMode("UPDATE")
    setEditingProblem(problem)
    setFormData({
      title: problem.title || "",
      content: problem.content || "",
      type: problem.type || "SHORT_ANSWER",
      choices: problem.choices || "",
      answer: problem.answer || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.answer) {
      alert("제목과 정답은 필수입니다!")
      return
    }

    if (mode === "CREATE") {
      const formDataObj = new FormData()
      formDataObj.append("title", formData.title)
      formDataObj.append("type", formData.type)
      formDataObj.append("answer", formData.answer)
      if (formData.content) formDataObj.append("content", formData.content)
      if (formData.type === "MULTIPLE_CHOICE" && formData.choices) {
        formDataObj.append("choices", formData.choices)
      }

      const res = await fetch(`/api/problems?groupId=${groupId}`, {
        method: "POST",
        body: formDataObj,
      })

      if (res.ok) {
        alert("완료!")
        setIsDialogOpen(false)
        loadProblems()
      } else {
        const msg = await res.text()
        alert(msg)
      }
    } else {
      const res = await fetch(`/api/problems/${editingProblem?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          type: formData.type,
          choices: formData.type === "MULTIPLE_CHOICE" ? formData.choices : null,
          answer: formData.answer,
        }),
      })

      if (res.ok) {
        alert("수정 완료!")
        setIsDialogOpen(false)
        loadProblems()
      } else {
        const msg = await res.text()
        alert(msg)
      }
    }
  }

  const deleteProblem = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return
    const res = await fetch(`/api/problems/${id}`, { method: "DELETE" })
    if (res.ok) loadProblems()
    else alert("삭제 실패")
  }

  const manageMember = async (userId: number, action: "approve" | "kick") => {
    const res = await fetch(`/api/groups/${groupId}/${action}/${userId}`, { method: "POST" })
    if (res.ok) loadMembers()
    else alert("처리 실패")
  }

  const leaveGroup = async () => {
    if (!confirm("정말 이 그룹에서 탈퇴하시겠습니까?")) return
    const res = await fetch(`/api/groups/${groupId}/leave`, { method: "DELETE" })
    if (res.ok) {
      alert("그룹에서 정상적으로 탈퇴했습니다.")
      router.push("/groups")
    } else {
      const msg = await res.text()
      alert("탈퇴 실패: " + msg)
    }
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

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Pending Screen */}
        {group.role === "PENDING" && (
          <Card className="bg-warning/10 border-warning/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Clock className="h-16 w-16 text-warning mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">가입 승인을 대기 중입니다</h2>
              <p className="text-muted-foreground">승인이 완료되어야 내용을 확인할 수 있습니다.</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
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
              {hasAdminAccess && (
                <div className="mb-6">
                  <Button
                    onClick={openCreateForm}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    새 문제 등록
                  </Button>
                </div>
              )}

              {problems.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">문제가 없습니다</p>
                    <p className="text-sm text-muted-foreground">새 문제를 등록해 주세요</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {problems.map((problem) => (
                    <Card
                      key={problem.id}
                      className="bg-card border-border hover:border-primary/50 transition-all"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold line-clamp-1">
                            {problem.title}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {problem.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {problem.content || "내용 없음"}
                        </p>
                        <div className="flex items-center justify-between">
                          <Link href={`/solve/${problem.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border hover:bg-primary hover:text-primary-foreground"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              풀이하기
                            </Button>
                          </Link>
                          {hasAdminAccess && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openUpdateForm(problem.id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteProblem(problem.id)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Problem Form Dialog */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{mode === "CREATE" ? "새 문제 등록" : "문제 수정"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>제목 *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="문제 제목"
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>내용</Label>
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="문제 내용"
                        className="bg-input border-border min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>유형 *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="SHORT_ANSWER">주관식</SelectItem>
                          <SelectItem value="MULTIPLE_CHOICE">객관식</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.type === "MULTIPLE_CHOICE" && (
                      <div className="space-y-2">
                        <Label>보기 (JSON 배열 형식)</Label>
                        <Input
                          value={formData.choices}
                          onChange={(e) => setFormData({ ...formData, choices: e.target.value })}
                          placeholder='["1번", "2번", "3번", "4번", "5번"]'
                          className="bg-input border-border"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>정답 *</Label>
                      <Input
                        value={formData.answer}
                        onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                        placeholder="정답"
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        저장
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1 border-border"
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Members Tab */}
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
