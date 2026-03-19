import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

// Notice this is a plain object, not a NextAuth instance
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
} satisfies NextAuthConfig
