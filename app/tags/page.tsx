"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Home, Tag } from "lucide-react"

interface TagItem {
  id: number
  name: string
  description?: string
}

export default function TagsPage() {
  const [allTags, setAllTags] = useState<TagItem[]>([])
  const [filteredTags, setFilteredTags] = useState<TagItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllTags()
  }, [])

  const fetchAllTags = async () => {
    try {
      const res = await fetch("/api/tags")
      if (!res.ok) throw new Error("API 오류")
      const data = await res.json()
      const sorted = data.sort((a: TagItem, b: TagItem) => a.name.localeCompare(b.name))
      setAllTags(sorted)
      setFilteredTags(sorted)
    } catch (e) {
      console.error(e)
      setError("태그 목록을 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredTags(allTags)
      return
    }
    const lowerQuery = query.toLowerCase()
    const filtered = allTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(lowerQuery) ||
        (tag.description && tag.description.toLowerCase().includes(lowerQuery))
    )
    setFilteredTags(filtered)
  }

  // 🚀 태그 설명의 불필요한 큰따옴표(")를 제거하는 헬퍼 함수 추가
  const cleanDescription = (desc?: string) => {
    if (!desc) return "상세 설명이 없습니다."
    // 시작과 끝에 있는 따옴표 제거, 혹은 전체 문자열의 모든 따옴표 제거
    return desc.replace(/^"|"$/g, '').trim()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Tag className="h-7 w-7 text-primary" />
              태그 사전
            </h1>
            <p className="text-sm text-muted-foreground">
              RaTag에 등록된 모든 문제 분류 태그와 상세 설명을 확인하세요.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-4 flex items-center gap-4">
            <Input
              placeholder="찾고 싶은 태그명이나 설명을 입력하세요..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-input border-border"
            />
            <Badge variant="secondary" className="whitespace-nowrap px-4 py-2">
              총 <span className="text-primary font-bold ml-1">{filteredTags.length}</span>개
            </Badge>
          </CardContent>
        </Card>

        {/* Tag Grid */}
        {isLoading ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              태그 데이터를 불러오는 중입니다...
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="bg-card border-destructive/50 border-dashed">
            <CardContent className="py-16 text-center text-destructive">{error}</CardContent>
          </Card>
        ) : filteredTags.length === 0 ? (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              {searchQuery ? "검색 결과와 일치하는 태그가 없습니다." : "등록된 태그가 없습니다."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map((tag) => (
              <Card
                key={tag.id}
                className="bg-card border-border hover:border-primary/50 transition-all hover:-translate-y-1"
              >
                <CardContent className="p-5">
                  <div className="text-base font-bold text-foreground mb-2 flex items-center">
                    <span className="text-primary mr-1">#</span>
                    {tag.name}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {/* 🚀 클린 함수 적용 */}
                    {cleanDescription(tag.description)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
