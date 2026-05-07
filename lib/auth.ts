import { SignJWT, jwtVerify } from "jose";

const AUTH_COOKIE_NAME = "auth_token";
const JWT_ALG = "HS256";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing required environment variable: AUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: { username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: [JWT_ALG],
  });
  return payload as { username?: string };
}

export { AUTH_COOKIE_NAME };
