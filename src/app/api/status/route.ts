import { NextResponse } from "next/server";
import { statusPayload } from "@/lib/mode";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(statusPayload());
}
