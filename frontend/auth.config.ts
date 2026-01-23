import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

// Notice this is only an object, not a full Auth function
export default {
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
         // Logic is handled in the main auth.ts for full DB access
         return null
      },
    }),
  ],
  pages: {
      signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnBeneficiary = nextUrl.pathname.startsWith('/beneficiary');
      const isOnVendor = nextUrl.pathname.startsWith('/vendor');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      if (isOnAdmin || isOnBeneficiary || isOnVendor || isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig
