type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, message: string, context: Record<string, unknown> = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  if (level === "error" || level === "warn") {
    console.error(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => emit("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => emit("error", m, c),
};

export function withRequestId(requestId: string) {
  return {
    debug: (m: string, c?: Record<string, unknown>) => emit("debug", m, { ...c, requestId }),
    info: (m: string, c?: Record<string, unknown>) => emit("info", m, { ...c, requestId }),
    warn: (m: string, c?: Record<string, unknown>) => emit("warn", m, { ...c, requestId }),
    error: (m: string, c?: Record<string, unknown>) => emit("error", m, { ...c, requestId }),
  };
}
