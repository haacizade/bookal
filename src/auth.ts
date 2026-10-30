import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

// The `code` ends up in a redirect URL, so it must not reveal whether an email exists.
class InvalidCredentials extends CredentialsSignin { code = "invalid_credentials"; }
class EmailNotVerified extends CredentialsSignin { code = "email_not_verified"; }

// Compared against when the email is unknown, so "no such user" costs the same time as "wrong password".
const DUMMY_HASH = "$2b$12$8z5uH2..Tg/H6y/BQ2OnVeMLwLf9Iis9WOidqvVQG.jZtxn61Ol12";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !passwordOk) throw new InvalidCredentials();

        // Only reveal "not verified" to someone who proved they know the password.
        if (!user.emailVerified) throw new EmailNotVerified();

        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl, role: user.role, isVip: user.isVip };
      },
    }),
  ],
});
