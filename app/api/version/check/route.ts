import { NextResponse } from "next/server";
import { checkForUpdates } from "@/lib/version";

export async function GET() {
  try {
    const status = await checkForUpdates();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking updates:", error);
    return NextResponse.json(
      { error: "Failed to check updates" },
      { status: 500 }
    );
  }
}