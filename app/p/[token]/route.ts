import { NextResponse } from "next/server";
import { isValidTokenShape } from "@/lib/proposals/tokens";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!isValidTokenShape(token)) {
    return NextResponse.redirect(new URL("/", _req.url));
  }
  return NextResponse.redirect(new URL(`/proposta/${token}`, _req.url));
}
