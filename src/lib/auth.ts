import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    // 30-day session lifetime — survives browser closes and page refreshes
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    updateAge: 24 * 60 * 60,   // Only refresh token once per day (reduce DB load)
  },

  jwt: {
    // JWT itself lives for 30 days to match session
    maxAge: 30 * 24 * 60 * 60,
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Ensure cookie persists across page refreshes (no maxAge = session cookie = dies on close)
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },

  callbacks: {
    async jwt({ token, user }: any) {
      // On first sign-in, attach user ID to JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: any) {
      // Propagate JWT fields to session object used by the app
      if (token?.id && session.user) {
        (session.user as any).id = token.id;
      }
      if (token?.email && session.user) {
        session.user.email = token.email;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },

  // Ensure NEXTAUTH_URL is set correctly in .env
  secret: process.env.NEXTAUTH_SECRET,

  // Debug in development only
  debug: process.env.NODE_ENV === "development",
};
