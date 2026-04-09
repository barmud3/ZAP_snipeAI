import { NextRequest, NextResponse } from "next/server";
import { generateOnboardingCallScript } from "@/lib/anthropic";
import { callScriptRequestSchema } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsedInput = callScriptRequestSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        { error: "Invalid call script request.", details: parsedInput.error.flatten() },
        { status: 400 }
      );
    }

    const script = await generateOnboardingCallScript(parsedInput.data.profile);
    return NextResponse.json({ script });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected call script failure.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
