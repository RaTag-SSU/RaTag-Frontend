"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Lock, Save, TrendingUp, Target, AlertTriangle, Trophy, BookOpen, Calendar, Home } from "lucide-react"
import Link from "next/link"

interface UserStats {
  totalSolved: number
  correctCount: number
  wrongCount: number
  accuracy: number
  weakTags: string[]
}

interface RecentActivity {
  problemId: number
  title: string
  result: "SUCCESS" | "FAIL"
  timestamp: string
}

interface UserProfile {
  id: number
  name: string
  email: string
  role: string
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [nickname, setNickname] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (!res.ok) {
        router.push("/login")
        return
      }
      const userData = await res.json()
      setUser(userData)
      setNickname(userData.name)

      // 통계 데이터
      const statsRes = await fetch("/api/users/stats")
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // 최근 활동 데이터
      const activityRes = await fetch("/api/users/activities?limit=10")
      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setActivities(activityData)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    const payload: { name?: string; password?: string } = {}
    if (nickname && nickname !== user?.name) payload.name = nickname
    if (newPassword) payload.password = newPassword

    if (Object.keys(payload).length === 0) {
      alert("변경할 내용이 없습니다.")
      return
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        alert("저장되었습니다.")
        setNewPassword("")
        fetchUserData()
      } else {
        const msg = await res.text()
        alert("저장 실패: " + msg)
      }
    } catch (e) {
      console.error(e)
      alert("오류가 발생했습니다.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </main>
      </div>
    )
  }

  const accuracy = stats?.accuracy ?? 0
  const totalSolved = stats?.totalSolved ?? 0
  const correctCount = stats?.correctCount ?? 0
  const wrongCount = stats?.wrongCount ?? 0
  const weakTags = stats?.weakTags ?? []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">마이페이지</h1>
              <p className="text-sm text-muted-foreground">계정 설정 및 학습 통계</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              홈으로
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                프로필 수정
              </CardTitle>
              <CardDescription>계정 정보를 수정하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">이메일</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-secondary border-border text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  비밀번호 변경
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 (변경 시에만 입력)"
                  className="bg-input border-border"
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Save className="mr-2 h-4 w-4" />
                저장하기
              </Button>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                학습 통계
              </CardTitle>
              <CardDescription>나의 학습 현황을 확인하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accuracy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    정답률
                  </span>
                  <span className="text-2xl font-bold text-green-500">
                    {accuracy.toFixed(1)}%
                  </span>
                </div>
                <Progress value={accuracy} className="h-2" />
              </div>

              <Separator />

              {/* Weak Tags */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-foreground">취약 태그</span>
                </div>
                {weakTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {weakTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-amber-500 text-amber-500">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">분석 중이거나 취약 태그가 없습니다.</p>
                )}
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{totalSolved}</p>
                  <p className="text-xs text-muted-foreground">총 풀이</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <Trophy className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold text-green-500">{correctCount}</p>
                  <p className="text-xs text-muted-foreground">성공</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
                  <p className="text-xs text-muted-foreground">실패</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              최근 활동
            </CardTitle>
            <CardDescription>최근 학습 기록</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                아직 풀이 기록이 없습니다. 문제를 풀어보세요!
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <Link key={index} href={`/solve/${activity.problemId}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.result === "SUCCESS" ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString("ko-KR")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={activity.result === "SUCCESS" ? "default" : "destructive"}
                        className={
                          activity.result === "SUCCESS"
                            ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                            : ""
                        }
                      >
                        {activity.result === "SUCCESS" ? "성공" : "실패"}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
