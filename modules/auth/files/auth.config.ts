import type { NextAuthConfig } from "next-auth";

/** Config sans adaptateur : utilisable dans le middleware (runtime edge). */
export const authConfig = {
  pages: { signIn: "/connexion" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? "user";
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
