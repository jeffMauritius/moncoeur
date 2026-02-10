import type { NextAuthConfig } from "next-auth";

// This config is used by the middleware (Edge runtime)
// It should not import any Node.js modules like mongoose
export const authConfig: NextAuthConfig = {
  providers: [], // Providers will be added in auth.ts
  trustHost: true, // Required for Vercel deployment
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "seller";
      }
      return session;
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = !nextUrl.pathname.startsWith("/login");
      const isOnAdminPage =
        nextUrl.pathname.startsWith("/users") ||
        nextUrl.pathname.startsWith("/bank-accounts");

      if (isOnDashboard) {
        if (isLoggedIn) {
          // Check admin pages
          if (isOnAdminPage && auth?.user?.role !== "admin") {
            return Response.redirect(new URL("/", nextUrl));
          }
          return true;
        }
        return false; // Redirect to login
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
};
