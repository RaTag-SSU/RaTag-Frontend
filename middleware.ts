import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. 브라우저에 스프링 부트의 세션 쿠키(JSESSIONID)가 존재하는지 확인
  const hasSession = request.cookies.has('JSESSIONID')

  // 2. 현재 접속하려는 경로
  const pathname = request.nextUrl.pathname

  // 3. 로그인이 "반드시" 필요한 보호된 페이지 목록 
  const isProtected = pathname.startsWith('/groups') || 
                      pathname.startsWith('/mypage') ||
                      pathname.startsWith('/solve')

  // 4. 로그인 화면으로 튕겨내기
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 5. 반대로 이미 로그인한 유저가 로그인/회원가입 페이지에 가면 메인으로 돌려보냄 (보너스 UX)
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // 백엔드 API 통신, 이미지, 정적 파일 등에는 미들웨어가 낭비되지 않도록 예외 처리
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
