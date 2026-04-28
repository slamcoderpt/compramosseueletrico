import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyArgs {
  secret: string;
  signature: string;
  rawBody: string;
}

export function verifyCalcomSignature({ secret, signature, rawBody }: VerifyArgs): boolean {
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (signature.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
