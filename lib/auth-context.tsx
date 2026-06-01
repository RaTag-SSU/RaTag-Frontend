"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { setUnauthorizedHandler } from "@/lib/api"

interface User {
  id: number
  email: string
  nickname?: string
  name?: string
  role: string
}

interface AuthContextValue {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  logout: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me")
      if (res.ok) {
        setUser(await res.json())
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" })
      document.cookie = "JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "SESSION=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    } catch (e) {
      console.error("로그아웃 오류:", e)
    } finally {
      setUser(null)
      window.location.href = "/?logout=clear"
    }
  }, [])

  useEffect(() => {
    // 401 발생 시 Context 초기화 + 리다이렉트 연결
    setUnauthorizedHandler(() => {
      setUser(null)
      window.location.href = "/login?new=1"
    })
    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
