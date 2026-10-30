import type { NextAuthConfig } from "next-auth";

const PROTECTED = ["/dashboard"];                 // wishlist lives at /dashboard/wishlist
const GUEST_ONLY = ["/login", "/register"];

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  providers: [],                                  // real provider is added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const loggedIn = !!auth?.user;
      if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) return loggedIn; // false → /login
      if (loggedIn && GUEST_ONLY.includes(pathname)) return Response.redirect(new URL("/dashboard", nextUrl));
      return true;
    },
    jwt({ token, user }) {
      if (user) { token.id = user.id!; token.role = user.role; token.isVip = user.isVip; }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.isVip = token.isVip;
      return session;
    },
  },
} satisfies NextAuthConfig;
