import { cookies } from "next/headers"
import { getToken } from "next-auth/jwt"

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = await getToken({
      req: { cookies: Object.fromEntries(cookieStore.getAll().map(c => [c.name, c.value])) } as any,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token?.email) return null
    return { id: token.id as string, name: token.name as string, email: token.email as string }
  } catch {
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user?.id) {
    return null
  }
  return user
}
