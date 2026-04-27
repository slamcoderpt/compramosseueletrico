import { http, HttpResponse } from "msw";

export const handlers = [
  // Resend
  http.post("https://api.resend.com/emails", async () => {
    return HttpResponse.json({ id: "test-email-id" });
  }),
  // Twilio messages
  http.post("https://api.twilio.com/2010-04-01/Accounts/:sid/Messages.json", async () => {
    return HttpResponse.json({ sid: "SM_test_123", status: "queued" });
  }),
];
