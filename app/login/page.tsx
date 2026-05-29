"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Mail, Lock, ArrowLeft, User } from "lucide-react"

type Section = "login" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const [section, setSection] = useState<Section>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  const [signupEmail, setSignupEmail] = useState("")
  const [signupNickname, setSignupNickname] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })
      if (res.ok) {
        // 🚀 핵심 수정 부분: Next.js의 부질없는 캐시를 날려버리고 강제로 브라우저를 새로고침하며 이동시킵니다!
        window.location.href = "/"
      } else {
        const text = await res.text()
        alert("로그인 실패: " + text)
      }
    } catch (error) {
      console.error(error)
      alert("로그인 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async () => {
    if (!signupEmail || !signupNickname || !signupPassword || !signupPasswordConfirm) {
      alert("모든 항목을 입력해주세요.")
      return
    }

    if (signupPassword !== signupPasswordConfirm) {
      alert("비밀번호가 일치하지 않습니다. 다시 확인해주세요.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupEmail,
          name: signupNickname,
          password: signupPassword,
        }),
      })
      
      if (res.ok) {
        setSection("login")
        setEmail(signupEmail) 
        
        setSignupEmail("")
        setSignupNickname("")
        setSignupPassword("")
        setSignupPasswordConfirm("")
      } else {
        const text = await res.text()
        alert("회원가입 실패: " + text)
      }
    } catch (error) {
      console.error(error)
      alert("회원가입 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">메인으로 돌아가기</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">RaTag</h1>
          </div>

          <Card className="bg-card border-border">
            {section === "login" ? (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl text-center">RaTag 로그인</CardTitle>
                  <CardDescription className="text-center">
                    계정에 로그인하여 학습을 시작하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      이메일
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      비밀번호
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-input border-border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleLogin()
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>

                  <button
                    onClick={() => setSection("signup")}
                    className="w-full text-sm text-primary hover:underline mt-2"
                  >
                    계정이 없으신가요? 회원가입
                  </button>

                  <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      OR
                    </span>
                  </div>

                  <a
                    href="/oauth2/authorization/google"
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    구글 계정으로 로그인
                  </a>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl text-center">RaTag 회원가입</CardTitle>
                  <CardDescription className="text-center">
                    새 계정을 만들어 학습을 시작하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      이메일 주소
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="이메일 주소"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-nickname" className="text-sm font-medium">
                      사용할 닉네임
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-nickname"
                        type="text"
                        placeholder="사용할 닉네임"
                        value={signupNickname}
                        onChange={(e) => setSignupNickname(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">
                      비밀번호
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="비밀번호"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="pl-10 bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password-confirm" className="text-sm font-medium">
                      비밀번호 확인
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password-confirm"
                        type="password"
                        placeholder="비밀번호를 다시 한 번 입력하세요"
                        value={signupPasswordConfirm}
                        onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                        className="pl-10 bg-input border-border"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSignup()
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSignup}
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                  >
                    {isLoading ? "처리 중..." : "회원가입 완료"}
                  </Button>

                  <button
                    onClick={() => setSection("login")}
                    className="w-full text-sm text-primary hover:underline mt-2"
                  >
                    이미 계정이 있으신가요? 로그인
                  </button>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
