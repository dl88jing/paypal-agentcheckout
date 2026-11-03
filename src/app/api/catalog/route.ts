import { NextResponse } from "next/server";
import { CATALOG } from "@/data/catalog";

export async function GET() {
  return NextResponse.json({ items: CATALOG });
}
