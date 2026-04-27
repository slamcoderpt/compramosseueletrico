import { parsePhoneNumberFromString } from "libphonenumber-js/mobile";

export class InvalidPhoneError extends Error {
  constructor(input: string) {
    super(`Não é um telemóvel português válido: ${input}`);
    this.name = "InvalidPhoneError";
  }
}

export function normalizePtMobile(input: string): string {
  const cleaned = input.trim();
  const phone = parsePhoneNumberFromString(cleaned, "PT");
  if (!phone || !phone.isValid() || phone.country !== "PT") {
    throw new InvalidPhoneError(input);
  }
  return phone.number as string;
}

export function isPtMobile(input: string): boolean {
  try {
    normalizePtMobile(input);
    return true;
  } catch {
    return false;
  }
}

export function maskPhone(e164: string): string {
  const m = e164.match(/^\+351(\d)(\d{2})(\d{3})(\d{3})$/);
  if (!m) return e164;
  return `+351 ${m[1]}XX XXX ${m[4]}`;
}
