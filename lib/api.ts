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
