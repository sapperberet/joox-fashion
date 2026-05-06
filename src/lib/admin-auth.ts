import { createHmac, timingSafeEqual } from "node:crypto";

const adminUser = process.env.ADMIN_USER ?? "asyouti";
const adminPass = process.env.ADMIN_PASS ?? "admin123";
const adminSecret = process.env.ADMIN_SECRET ?? "joox-fashion-secret";

function sign(user: string) {
  return createHmac("sha256", adminSecret).update(user).digest("hex");
}

export function verifyCredentials(user: string, pass: string) {
  return user === adminUser && pass === adminPass;
}

export function createAdminToken() {
  return createHmac("sha256", adminSecret)
    .update(`${adminUser}:${adminPass}`)
    .digest("hex");
}

export function verifyAdminToken(token?: string | null) {
  if (!token) {
    return false;
  }

  const expected = createAdminToken();
  if (token.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
