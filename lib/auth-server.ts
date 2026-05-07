import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function requireApiAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  try {
    await verifyAuthToken(token);
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}

