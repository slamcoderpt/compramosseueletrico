"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

interface BookingEmbedProps {
  calLink: string;
  token: string;
  prefillName: string;
  prefillEmail: string;
}

export function BookingEmbed({
  calLink,
  token,
  prefillName,
  prefillEmail,
}: BookingEmbedProps) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: {
          branding: { brandColor: "#0d7066" },
        },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <Cal
      calLink={calLink}
      config={{
        name: prefillName,
        email: prefillEmail,
        metadata: { proposalToken: token },
        theme: "light",
      }}
      style={{
        width: "100%",
        height: "calc(100vh - 200px)",
        minHeight: "600px",
        overflow: "scroll",
      }}
    />
  );
}
