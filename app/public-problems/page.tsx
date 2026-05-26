"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Globe, Plus, Pencil, Trash2, BookOpen, ExternalLink } from "lucide-react"

interface Problem {
  id: number
  title: string
  content: string
  sourcePath: string
  type: "SHORT_ANSWER" | "MULTIPLE_CHOICE"
  choices: string | null
  answer: string
}

export default function PublicProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("ROLE_USER")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mode, setMode] = useState<"CREATE" | "UPDATE">("CREATE")
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    sourcePath: "",
    content: "",
    type: "SHORT_ANSWER",
    choices: "",
    answer: "",
  })

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : { role: "ROLE_USER" }))
      .then((user) => {
        setUserRole(user.role)
        loadProblems()
      })
      .catch(() => loadProblems())
  }, [])

  const loadProblems = () => {
    fetch("/api/problems")
      .then((res) => res.json())
      .then((data) => {
        setProblems(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("목록 로드 에러:", err)
        setLoading(false)
      })
  }

  const openCreateForm = () => {
    setMode("CREATE")
    setEditingProblem(null)
    setFormData({ title: "", sourcePath: "", content: "", type: "SHORT_ANSWER", choices: "", answer: "" })
    setIsDialogOpen(true)
  }

  const openUpdateForm = (problem: Problem) => {
    setMode("UPDATE")
    setEditingProblem(problem)
    setFormData({
      title: problem.title,
      sourcePath: problem.sourcePath || "",
      content: problem.content,
      type: problem.type,
      choices: problem.choices || "",
      answer: problem.answer,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    const payload = {
      title: formData.title,
      sourcePath: formData.sourcePath,
      content: formData.content,
      type: formData.type,
      choices: formData.type === "MULTIPLE_CHOICE" ? formData.choices : null,
      answer: formData.answer,
    }

    const url = mode === "CREATE" ? "/api/problems" : `/api/problems/${editingProblem?.id}`
    const method = mode === "CREATE" ? "POST" : "PUT"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      alert("저장되었습니다.")
      setIsDialogOpen(false)
      loadProblems()
    } else {
      const msg = await res.text()
      alert("저장 실패: " + msg)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    const res = await fetch(`/api/problems/${id}`, { method: "DELETE" })
    if (res.ok) {
      alert("삭제되었습니다.")
      loadProblems()
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
                  <div className="space-y-2">
                    <Label>제목</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="문제 제목"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>경로 (선택)</Label>
                    <Input
                      value={formData.sourcePath}
                      onChange={(e) => setFormData({ ...formData, sourcePath: e.target.value })}
                      placeholder="예: 2024/수능/수학"
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
                    <Label>유형</Label>
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
                    <Label>정답</Label>
                    <Input
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="정답"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
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
          )}
        </div>

        {/* Problem List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-secondary rounded w-3/4" />
                </CardHeader>
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
              <p className="text-lg font-medium text-foreground mb-2">등록된 문제가 없습니다</p>
              <p className="text-sm text-muted-foreground">새 문제를 등록해 주세요</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {problems.map((problem) => (
              <Card
                key={problem.id}
                className="bg-card border-border hover:border-primary/50 transition-all group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {problem.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {problem.type === "MULTIPLE_CHOICE" ? "객관식" : "주관식"}
                    </Badge>
                  </div>
                  {problem.sourcePath && (
                    <Badge variant="secondary" className="text-xs w-fit">
                      {problem.sourcePath}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {problem.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <Link href={`/solve/${problem.id}`}>
                      <Button variant="outline" size="sm" className="border-border hover:bg-primary hover:text-primary-foreground">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        풀이하기
                      </Button>
                    </Link>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openUpdateForm(problem)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(problem.id)}
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
      </main>
    </div>
  )
}
