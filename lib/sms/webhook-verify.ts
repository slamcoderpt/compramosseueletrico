import twilio from "twilio";

export interface VerifyArgs {
  authToken: string;
  signature: string;
  url: string;
  params: Record<string, string>;
}

export function verifyTwilioSignature({ authToken, signature, url, params }: VerifyArgs): boolean {
  if (!authToken || !signature) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
