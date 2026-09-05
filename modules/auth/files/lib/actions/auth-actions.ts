"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type ActionState = { error?: string } | undefined;

/**
 * Connexion. Il n'y a pas d'inscription publique sur ce site :
 * le compte est créé par le seed, ou à la main en base.
 */
export async function connexion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const suite = String(formData.get("suite") || "/admin");
  const destination = suite.startsWith("/") && !suite.startsWith("//") ? suite : "/admin";

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: destination,
    });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Identifiants incorrects." };
    throw e;
  }
}
