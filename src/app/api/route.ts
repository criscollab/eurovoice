import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "Neón Radio API",
    version: "1.0",
    endpoints: [
      "GET /api/stations",
      "POST /api/stations",
      "GET /api/stations/[id]",
      "PATCH /api/stations/[id]",
      "DELETE /api/stations/[id]",
      "GET /api/stations/[id]/now-playing",
      "GET /api/stations/[id]/songs",
      "POST /api/stations/[id]/songs",
      "POST /api/stations/[id]/reorder",
      "PATCH /api/songs/[id]",
      "DELETE /api/songs/[id]",
      "POST /api/seed",
    ],
  });
}
