"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Users, Tag, ChartBar } from "lucide-react"

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight text-balance">
            집단지성 문제해결 플랫폼, <span className="text-primary">RaTag</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            해결한 문제에 태그를 달고, 사람들과 인사이트를 공유하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <Search className="h-5 w-5" />
              최적의 문제 탐색하기
            </Link>
            <Link
              href={isLoggedIn ? "/groups" : "/login"}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-bold text-foreground hover:bg-secondary transition-colors"
            >
              <Users className="h-5 w-5" />
              {isLoggedIn ? "내 그룹 가기" : "로그인하고 시작하기"}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-card border-border text-center p-8">
            <CardContent className="p-0">
              <div className="text-4xl mb-4">
                <ChartBar className="h-10 w-10 mx-auto text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">정교한 난이도 추정</h3>
              <p className="text-sm text-muted-foreground">
                참여자들의 평가 데이터를 모아 문제의 실제 체감 정답률을 도출합니다.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border text-center p-8">
            <CardContent className="p-0">
              <div className="text-4xl mb-4">
                <Tag className="h-10 w-10 mx-auto text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">유연한 태그 시스템</h3>
              <p className="text-sm text-muted-foreground">
                문제의 핵심 풀이와 특징을 태그로 달아보세요.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border text-center p-8">
            <CardContent className="p-0">
              <div className="text-4xl mb-4">
                <Users className="h-10 w-10 mx-auto text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">프라이빗 그룹 스터디</h3>
              <p className="text-sm text-muted-foreground">
                우리 그룹만의 독립적인 문제집을 만들고 그룹원들의 수준을 확인하세요.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
