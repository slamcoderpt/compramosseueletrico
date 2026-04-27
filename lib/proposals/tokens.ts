import { randomBytes } from "node:crypto";

const TOKEN_LENGTH = 32;
const TOKEN_REGEX = /^[A-Za-z0-9_-]{32}$/;

export function generateProposalToken(): string {
  return randomBytes(24).toString("base64url");
}

export function isValidTokenShape(t: string): boolean {
  return typeof t === "string" && TOKEN_REGEX.test(t);
}

export const PROPOSAL_TOKEN_LENGTH = TOKEN_LENGTH;
