import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
const handler = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin" },
  providers: [CredentialsProvider({
    name: "Admin credentials",
    credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;
      const user = await prisma.adminUser.findUnique({ where: { email: credentials.email.toLowerCase() } });
      if (!user || !(await bcrypt.compare(credentials.password, user.passwordHash))) return null;
      return { id: user.id, email: user.email, role: user.role } as never;
    },
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as unknown as { role: string }).role; return token; },
    async session({ session, token }) { (session.user as { role?: string }).role = token.role as string; return session; },
  },
});
export { handler as GET, handler as POST };
