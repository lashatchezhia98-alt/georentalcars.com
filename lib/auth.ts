import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";

function secureMatch(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    CredentialsProvider({
      name: "Owner credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const ownerPassword = process.env.ADMIN_PASSWORD;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!ownerEmail || (!ownerPassword && !passwordHash) || !credentials?.email || !credentials.password) return null;
        if (credentials.email.trim().toLowerCase() !== ownerEmail) return null;
        const passwordMatches = ownerPassword
          ? secureMatch(credentials.password, ownerPassword)
          : await bcrypt.compare(credentials.password, passwordHash!);
        if (!passwordMatches) return null;
        return { id: "owner", email: ownerEmail, role: "FULL" } as never;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = "FULL";
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = String(token.role || "FULL");
      return session;
    },
  },
};
