import type { DefaultSession } from "next-auth";

type AppRole = "USER" | "ADMIN";

declare module "next-auth" {
  interface User { role: AppRole; isVip: boolean }
  interface Session { user: { id: string; role: AppRole; isVip: boolean } & DefaultSession["user"] }
}
declare module "@auth/core/jwt" {
  interface JWT { id: string; role: AppRole; isVip: boolean }
}
