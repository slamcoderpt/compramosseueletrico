export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = (
  err: unknown,
  request: Request,
  context: { routerKind: "Pages Router" | "App Router"; routePath: string },
) => {
  if (!process.env.SENTRY_DSN) return;
  import("@sentry/nextjs").then(({ captureRequestError }) =>
    captureRequestError(err, request as any, context as any),
  );
};
