"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Home, ChevronDown, ChevronUp, X, LayoutList, LayoutGrid } from "lucide-react"

interface Tag {
  id: number
  name: string
  description?: string
}

interface Group {
  id: number
  name: string
  role: string
}

// 🚀 공개 문제와 동일하게 Problem 인터페이스 확장
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
}

export default function SearchPage() {
  const [searchTitle, setSearchTitle] = useState("")
  const [searchScope, setSearchScope] = useState("public")
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [minDiff, setMinDiff] = useState("")
  const [maxDiff, setMaxDiff] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tagSuggestions, setTagSuggestions] = useState<Tag[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [results, setResults] = useState<Problem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // 페이징 및 UI 상태 관리
  const [currentPage, setCurrentPage] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)
  const [expandedTags, setExpandedTags] = useState<Set<number>>(new Set())
  const [viewMode, setViewMode] = useState<"list" | "grid">("list") // 🚀 1열/3열 뷰 모드 추가
  const pageSize = 100

  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    try {
      const res = await fetch("/api/users/me")
      if (res.ok) {
        setIsLoggedIn(true)
        const groupRes = await fetch("/api/groups")
        if (groupRes.ok) {
          const groupData = await groupRes.json()
          setGroups(groupData.filter((g: Group) => g.role === "MEMBER" || g.role === "ADMIN"))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTagsAutocomplete = async (query: string) => {
    if (!query.trim()) {
      setTagSuggestions([])
      return
    }
    try {
      const res = await fetch(`/api/tags/search?query=${encodeURIComponent(query)}`)
      const tags = await res.json()
      setTagSuggestions(tags)
    } catch (e) {
      console.error(e)
    }
  }

  const addTag = (name: string) => {
    if (!selectedTags.includes(name)) {
      setSelectedTags([...selectedTags, name])
    }
    setTagInput("")
    setTagSuggestions([])
  }

  const removeTag = (name: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== name))
  }

  const resetFilters = () => {
    setSearchTitle("")
    setSearchScope("public")
    setSelectedGroupId("")
    setMinDiff("")
    setMaxDiff("")
    setSelectedTags([])
    setTagInput("")
    setResults([])
    setCurrentPage(0)
    setIsLastPage(false)
  }

  const performSearch = async (append = false) => {
    const page = append ? currentPage + 1 : 0
    setCurrentPage(page)
    if (!append) {
      setResults([])
    }
    setIsLoading(true)

    const payload: Record<string, unknown> = {
      title: searchTitle || null,
      minDifficulty: minDiff ? parseInt(minDiff) : null,
      maxDifficulty: maxDiff ? parseInt(maxDiff) : null,
      tags: selectedTags.length > 0 ? selectedTags : null,
      groupId: searchScope === "group" && selectedGroupId ? parseInt(selectedGroupId) : null,
      page,
      size: pageSize,
    }

    try {
      const res = await fetch("/api/problems/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setIsLastPage(data.length < pageSize)
        if (append) {
          setResults((prev) => [...prev, ...data])
        } else {
          setResults(data)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTags = (id: number) => {
    setExpandedTags((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">문제 탐색 및 검색</h1>
            <p className="text-sm text-muted-foreground">원하는 필터 조건들을 조합하여 문제를 검색해보세요.</p>
          </div>
        </div>

        {/* Filter Box */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Title Search */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">문제 제목 키워드</Label>
                <Input
                  placeholder="검색할 단어를 입력하세요"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              {/* Scope */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">탐색 범위</Label>
                <Select
                  value={searchScope}
                  onValueChange={setSearchScope}
                  disabled={!isLoggedIn}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">공개 문제</SelectItem>
                    <SelectItem value="group">내 그룹 문제</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Group Select */}
              {searchScope === "group" && (
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-bold text-muted-foreground">소속 스터디 그룹 선택</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="소속된 스터디 그룹을 선택해 주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Difficulty Range */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">평균 예상 정답률 범위 (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="최소(0)"
                    min="0"
                    max="100"
                    value={minDiff}
                    onChange={(e) => setMinDiff(e.target.value)}
                    className="bg-input border-border text-center"
                  />
                  <span className="text-muted-foreground">~</span>
                  <Input
                    type="number"
                    placeholder="최대(100)"
                    min="0"
                    max="100"
                    value={maxDiff}
                    onChange={(e) => setMaxDiff(e.target.value)}
                    className="bg-input border-border text-center"
                  />
                </div>
              </div>

              {/* Tag Search */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">태그 검색</Label>
                <div className="relative">
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          #{tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Input
                    placeholder="태그를 검색하여 추가하세요"
                    value={tagInput}
                    onChange={(e) => {
                      setTagInput(e.target.value)
                      fetchTagsAutocomplete(e.target.value)
                    }}
                    className="bg-input border-border"
                  />
                  {tagSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {tagSuggestions.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => addTag(tag.name)}
                          className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors"
                        >
                          <span className="font-bold text-foreground">#{tag.name}</span>
                          {tag.description && (
                            <span className="text-xs text-muted-foreground ml-2">{tag.description}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button onClick={() => performSearch(false)} className="flex-[4] gap-2 font-bold py-6">
                <Search className="h-5 w-5" />
                조건에 맞게 필터링하기
              </Button>
              <Button variant="secondary" onClick={resetFilters} className="flex-1 font-bold">
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-foreground">
              검색 결과 리스트 (<span className="text-primary">{results.length}</span>개)
            </h2>
            
            {/* 🚀 1열 / 3열 뷰 모드 토글 (공개 문제와 동일) */}
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

          {isLoading && results.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                조건에 최적화된 문항을 선별하고 있습니다...
              </CardContent>
            </Card>
          ) : results.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center text-muted-foreground">
                필터를 설정하고 상단의 버튼을 눌러 탐색을 수행하세요.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
                {results.map((problem) => (
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
                      {/* 검색 결과에서도 내용(content)을 보여주도록 추가 */}
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

              {!isLastPage && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    className="w-full max-w-sm py-5 font-bold shadow-sm"
                    onClick={() => performSearch(true)}
                    disabled={isLoading}
                  >
                    {isLoading ? "로딩 중..." : <><ChevronDown className="mr-1.5 h-4 w-4" /> 더보기</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
