import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 🚀 1. 브라우저의 모든 쿠키를 가져와서 이름에 'SESSION'이 포함된 쿠키가 있는지 싹 다 뒤집니다.
  // (JSESSIONID, SESSION 모두 커버 가능)
  const cookies = request.cookies.getAll()
  const hasSession = cookies.some(c => c.name.includes('SESSION'))

  const pathname = request.nextUrl.pathname

  // 2. 로그인이 "반드시" 필요한 보호된 페이지 목록 
  const isProtected = pathname.startsWith('/groups') || pathname.startsWith('/mypage') || pathname.startsWith('/solve')

  // 3. 보호된 페이지인데 출입증(쿠키)이 없다면 로그인 화면으로 튕겨냄!
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 4. 이미 로그인한 유저가 로그인 창에 가면 메인으로 돌려보냄
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
