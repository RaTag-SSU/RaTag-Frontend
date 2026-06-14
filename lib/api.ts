let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, { cache: "no-store", ...options })
  if (res.status === 401) {
    if (unauthorizedHandler) {
      unauthorizedHandler()
    } else {
      window.location.href = "/login?new=1"
    }
    throw new Error("Unauthorized")
  }
  return res
}

// 백엔드 GlobalExceptionHandler가 반환하는 { code, message } JSON에서 메시지 추출
export async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data.message ?? "요청에 실패했습니다."
  } catch {
    return "요청에 실패했습니다."
  }
}
