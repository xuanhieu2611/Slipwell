import { NextResponse } from "next/server";
import { z } from "zod";
import { undoDomainMutation } from "@/src/modules/activity";
import { getCurrentIdentity } from "@/src/modules/identity/server";

const mutationIdSchema = z.string().uuid();

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const identity = await getCurrentIdentity();

  if (!identity) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 },
    );
  }

  const mutationId = mutationIdSchema.safeParse((await context.params).id);
  if (!mutationId.success) {
    return NextResponse.json(
      { error: "Mutation ID is invalid." },
      { status: 400 },
    );
  }

  try {
    const result = await undoDomainMutation({
      workspaceId: identity.workspace_id,
      actorId: identity.user_id,
      mutationId: mutationId.data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "The change could not be undone. Refresh and try again." },
      { status: 409 },
    );
  }
}
