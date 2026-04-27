import { http, HttpResponse } from "msw";

export const handlers = [
  // Resend
  http.post("https://api.resend.com/emails", async () => {
    return HttpResponse.json({ id: "test-email-id" });
  }),
];
