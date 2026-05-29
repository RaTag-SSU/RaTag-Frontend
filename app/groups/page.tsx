"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // 🚀 useRouter 추가
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, Plus, Crown, UserCheck, Clock, UserPlus, ArrowRight } from "lucide-react"

interface Group {
  id: number
  name: string
  description: string
  role: "ADMIN" | "MEMBER" | "PENDING" | "NONE"
}

export default function GroupsPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false) // 🚀 권한 확인 상태 추가
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("my")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDesc, setNewGroupDesc] = useState("")

  useEffect(() => {
    // 🚀 화면이 켜지자마자 권한부터 검사합니다.
    const checkAuthAndLoad = async () => {
      try {
        const authRes = await fetch("/api/users/me")
        if (!authRes.ok) {
          alert("로그인이 필요한 서비스입니다.")
          router.push("/login")
          return
        }
        
        // 권한이 확인되면 화면을 열어주고 그룹 데이터를 불러옵니다.
        setIsAuthorized(true)
        loadGroups()
      } catch (e) {
        router.push("/login")
      }
    }

    checkAuthAndLoad()
  }, [router])

  const loadGroups = () => {
    fetch("/api/groups")
      .then((res) => res.json())
      .then((data) => {
        setGroups(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("그룹 로드 에러:", err)
        setLoading(false)
      })
  }

  const createGroup = async () => {
    if (!newGroupName) return
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
    })
    if (res.ok) {
      setNewGroupName("")
      setNewGroupDesc("")
      setIsDialogOpen(false)
      loadGroups()
    }
  }

  const joinGroup = async (id: number) => {
    const res = await fetch(`/api/groups/${id}/join`, { method: "POST" })
    if (res.ok) {
      alert("가입 신청이 완료되었습니다.")
      loadGroups()
    }
  }

  // 🚀 권한을 확인하는 찰나의 순간 동안 보여줄 화면 (깜빡임 방지용)
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

  const myGroups = groups.filter((g) => g.role !== "NONE")
  const allGroups = groups

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/50">
            <Crown className="mr-1 h-3 w-3" />
            방장
          </Badge>
        )
      case "MEMBER":
        return (
          <Badge className="bg-success/20 text-success border-success/50">
            <UserCheck className="mr-1 h-3 w-3" />
            소속됨
          </Badge>
        )
      case "PENDING":
        return (
          <Badge className="bg-warning/20 text-warning border-warning/50">
            <Clock className="mr-1 h-3 w-3" />
            대기중
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">스터디 그룹</h1>
              <p className="text-sm text-muted-foreground">함께 공부하며 성장하세요</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                새 그룹 만들기
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle>새 그룹 만들기</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>그룹 이름</Label>
                  <Input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="그룹 이름"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>설명</Label>
                  <Input
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="그룹 설명 (선택)"
                    className="bg-input border-border"
                  />
                </div>
                <Button
                  onClick={createGroup}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  생성하기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full max-w-md bg-secondary border border-border">
            <TabsTrigger value="my" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              내가 속한 그룹
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              전체 보기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-6">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card border-border animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-secondary rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-secondary rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myGroups.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">참여 중인 그룹이 없습니다</p>
                  <p className="text-sm text-muted-foreground mb-4">새 그룹을 만들거나 기존 그룹에 가입하세요</p>
                  <Button
                    onClick={() => setTab("all")}
                    variant="outline"
                    className="border-border"
                  >
                    전체 그룹 보기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myGroups.map((group) => (
                  <Link key={group.id} href={`/groups/${group.id}`}>
                    <Card className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base font-semibold">{group.name}</CardTitle>
                          {getRoleBadge(group.role)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {group.description || "설명이 없습니다"}
                        </p>
                        <div className="flex items-center text-primary text-sm font-medium">
                          상세보기
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-card border-border animate-pulse">
                    <CardHeader>
                      <div className="h-5 bg-secondary rounded w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-secondary rounded w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : allGroups.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">등록된 그룹이 없습니다</p>
                  <p className="text-sm text-muted-foreground">첫 그룹을 만들어 보세요!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {allGroups.map((group) => (
                  <Card
                    key={group.id}
                    className="bg-card border-border hover:border-primary/50 transition-all"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold">{group.name}</CardTitle>
                        {getRoleBadge(group.role)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {group.description || "설명이 없습니다"}
                      </p>
                      {group.role === "NONE" ? (
                        <Button
                          onClick={() => joinGroup(group.id)}
                          size="sm"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          가입 신청
                        </Button>
                      ) : (
                        <Link href={`/groups/${group.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-border"
                          >
                            상세보기
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
