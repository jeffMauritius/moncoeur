import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Use only the edge-compatible config (no mongoose)
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
