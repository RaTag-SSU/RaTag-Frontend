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
import { 
  User, Lock, Save, TrendingUp, Target, AlertTriangle, 
  Trophy, BookOpen, Calendar, Home, CheckCircle2, XCircle, Trash2 
} from "lucide-react"
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
  nickname?: string
  name?: string
  email: string
  role: string
  solvedProblemIds?: number[]
  wrongProblemIds?: number[]
}

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  
  // 프로필 수정 상태
  const [nickname, setNickname] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  
  // 회원탈퇴 상태
  const [withdrawPassword, setWithdrawPassword] = useState("")
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (!res.ok) {
        alert("로그인이 필요합니다.")
        router.push("/login")
        return
      }
      const userData = await res.json()
      setUser(userData)
      // html에서는 nickname, 이전 tsx에서는 name을 사용했으므로 호환성 유지
      setNickname(userData.nickname || userData.name || "")

      // 학습 통계 데이터 (유지)
      const statsRes = await fetch("/api/users/stats")
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // 최근 활동 데이터 (유지)
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

  // 🚀 html의 로직을 반영한 프로필 수정 (현재 비밀번호 필수)
  const handleSaveProfile = async () => {
    if (!currentPassword) {
      alert("정보를 수정하려면 현재 비밀번호를 입력해주세요.")
      return
    }

    const payload: { currentPassword: string; nickname?: string; newPassword?: string } = {
      currentPassword,
    }
    
    if (nickname && nickname !== (user?.nickname || user?.name)) payload.nickname = nickname
    if (newPassword) payload.newPassword = newPassword

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        alert("성공적으로 저장되었습니다.")
        setCurrentPassword("")
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

  // 🚀 html의 로직을 반영한 회원탈퇴
  const handleWithdraw = async () => {
    if (!withdrawPassword) {
      alert("탈퇴를 위해 현재 비밀번호를 입력해주세요.")
      return
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: withdrawPassword }),
      })
      if (res.ok) {
        alert("회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.")
        router.push("/")
      } else {
        const msg = await res.text()
        alert("탈퇴 실패: " + msg)
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
            <p className="text-muted-foreground animate-pulse font-bold">데이터를 불러오는 중입니다...</p>
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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
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
          {/* 🚀 좌측 컬럼: 계정 설정 및 회원탈퇴 */}
          <div className="space-y-6">
            {/* Profile Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  계정 정보 및 수정
                </CardTitle>
                <CardDescription>
                  {user?.role === "ROLE_ADMIN" ? "관리자 계정입니다." : "일반 회원 계정입니다."}
                </CardDescription>
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
                
                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">현재 비밀번호 <span className="text-destructive">*</span></Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="정보 수정을 위해 현재 비밀번호를 입력하세요"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">새 닉네임</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="변경할 닉네임"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="변경 시에만 입력하세요"
                    className="bg-input border-border"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                >
                  <Save className="mr-2 h-4 w-4" />
                  변경사항 저장
                </Button>
              </CardContent>
            </Card>

            {/* Account Withdrawal */}
            <Card className="bg-card border-destructive/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  계정 삭제
                </CardTitle>
                <CardDescription>
                  탈퇴 시 방장으로 있는 그룹은 먼저 삭제해야 합니다. 삭제된 데이터는 복구할 수 없습니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawPassword">비밀번호 확인</Label>
                  <Input
                    id="withdrawPassword"
                    type="password"
                    value={withdrawPassword}
                    onChange={(e) => setWithdrawPassword(e.target.value)}
                    placeholder="현재 비밀번호"
                    className="bg-input border-destructive/20"
                  />
                </div>
                
                <div className="flex items-center space-x-2 bg-destructive/5 border border-destructive/20 p-3 rounded-lg mt-2">
                  <input
                    type="checkbox"
                    id="withdraw-confirm"
                    checked={withdrawConfirm}
                    onChange={(e) => setWithdrawConfirm(e.target.checked)}
                    className="w-4 h-4 rounded border-destructive/50 text-destructive accent-destructive cursor-pointer"
                  />
                  <Label
                    htmlFor="withdraw-confirm"
                    className="text-sm font-medium leading-none cursor-pointer text-destructive/90"
                  >
                    정말로 탈퇴하겠습니다. 이 작업은 되돌릴 수 없습니다.
                  </Label>
                </div>

                <Button
                  onClick={handleWithdraw}
                  disabled={!withdrawConfirm}
                  variant="destructive"
                  className="w-full mt-2"
                >
                  회원탈퇴 진행
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 🚀 우측 컬럼: 학습 통계 및 문제 기록 */}
          <div className="space-y-6">
            {/* Stats Overview (유지) */}
            <Card className="bg-card border-border h-fit">
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
                      <Target className="h-4 w-4 text-emerald-500" />
                      정답률
                    </span>
                    <span className="text-2xl font-bold text-emerald-500">
                      {accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={accuracy} className="h-2 bg-emerald-100 [&>div]:bg-emerald-500" />
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
                        <Badge key={tag} variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
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
                  <div className="text-center p-3 rounded-lg bg-secondary/60">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold text-foreground">{totalSolved}</p>
                    <p className="text-xs text-muted-foreground mt-1">총 풀이</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <Trophy className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                    <p className="text-2xl font-bold text-emerald-600">{correctCount}</p>
                    <p className="text-xs text-emerald-600/70 mt-1">성공</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                    <p className="text-2xl font-bold text-destructive">{wrongCount}</p>
                    <p className="text-xs text-destructive/70 mt-1">실패</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🚀 학습 기록 리스트 (html 요소 통합) */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  전체 학습 기록
                </CardTitle>
                <CardDescription>지금까지 풀었던 문제 번호 모아보기</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="flex items-center gap-1.5 text-emerald-600 mb-2">
                    <CheckCircle2 className="h-4 w-4" /> 맞은 문제
                  </Label>
                  <div className="p-3 bg-secondary/40 rounded-lg min-h-[60px] flex flex-wrap gap-2">
                    {user?.solvedProblemIds && user.solvedProblemIds.length > 0 ? (
                      user.solvedProblemIds.map(id => (
                        <Link key={id} href={`/solve/${id}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                            {id}번
                          </Badge>
                        </Link>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground m-auto">기록이 없습니다.</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="flex items-center gap-1.5 text-destructive mb-2">
                    <XCircle className="h-4 w-4" /> 틀린 문제
                  </Label>
                  <div className="p-3 bg-secondary/40 rounded-lg min-h-[60px] flex flex-wrap gap-2">
                    {user?.wrongProblemIds && user.wrongProblemIds.length > 0 ? (
                      user.wrongProblemIds.map(id => (
                        <Link key={id} href={`/solve/${id}`}>
                          <Badge variant="outline" className="cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                            {id}번
                          </Badge>
                        </Link>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground m-auto">기록이 없습니다.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity (유지) */}
        <Card className="mt-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              최근 활동 (최대 10개)
            </CardTitle>
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
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.result === "SUCCESS" ? "bg-emerald-500" : "bg-destructive"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            <span className="text-muted-foreground mr-2 text-xs">[{activity.problemId}번]</span>
                            {activity.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(activity.timestamp).toLocaleDateString("ko-KR", { 
                              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={activity.result === "SUCCESS" ? "default" : "destructive"}
                        className={
                          activity.result === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200"
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
