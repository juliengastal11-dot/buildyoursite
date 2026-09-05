import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

/** Ajuster selon le blueprint. */
const PROTECTED = ["/admin"];

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  if (needsAuth && !req.auth) {
    const url = new URL("/connexion", req.nextUrl.origin);
    url.searchParams.set("suite", path);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|svg|webp)$).*)"],
};
