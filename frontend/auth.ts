import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import authConfig from "./auth.config"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // Required for middleware to work with database adapter usually, or use database session but middleware has limits. Let's try default or jwt.
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      id: "web3",
      name: "Web3",
      credentials: {
        address: { label: "Address", type: "text" },
        role: { label: "Role", type: "text" }, 
      },
      async authorize(credentials) {
        if (!credentials?.address) return null
        
        const address = credentials.address as string
        const role = (credentials.role as string) || "DONOR"
        
        const user = await prisma.user.upsert({
          where: { address },
          update: {}, 
          create: {
            address,
            role: role,
          },
        })
        
        return user as any
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (token.sub && session.user) {
         session.user.id = token.sub;
      }
      
      // Token contains the role?
      if (token.role && session.user) {
         session.user.role = token.role as string;
      }
      
      // We might need to fetch from DB if using JWT
      // But let's start with basic mapping
      
      return session;
    },
      async jwt({ token, user, trigger, session }) {
        if (user) {
            token.role = user.role;
            token.address = user.address;
            
            // SUPER ADMIN OVERRIDE
            if (user.email === "rahulchaudharyji2@gmail.com") {
                token.role = "ADMIN";
                // Also update DB asynchronously to keep it in sync
                await prisma.user.update({
                    where: { email: user.email },
                    data: { role: "ADMIN", isAdmin: true }
                }).catch(err => console.error("Failed to auto-update admin role", err));
            }
        }
        
        // If we have an email in the token, double check admin status (redundancy for existing sessions)
        if (token.email === "rahulchaudharyji2@gmail.com" && token.role !== "ADMIN") {
             token.role = "ADMIN";
        }

        return token
    }
  },
})
