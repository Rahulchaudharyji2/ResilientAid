import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      address?: string
    } & DefaultSession["user"]
  }

  interface User {
    role?: string
    isAdmin?: boolean
    address?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    address?: string
  }
}
