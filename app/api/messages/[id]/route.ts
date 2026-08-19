import type { Message, MessageRole, UpdateMessage } from "@/backend/model";
import { ApiError, assertChatOwner, assertDatabaseResult, assertUuid, getAuthenticatedSupabase, handleApiError, readJson } from "@/backend/lib/api";

const roles: MessageRole[] = ["user", "assistant", "system"];
type MessageContext = { params: Promise<{ id: string }> };

async function getOwnedMessage(request: Request, id: string) {
  const auth = await getAuthenticatedSupabase(request);
  const { data, error } = await auth.supabase.from("messages").select("*").eq("id", id).maybeSingle();
  assertDatabaseResult(error);
  if (!data) throw new ApiError(404, "Message not found.");
  await assertChatOwner(auth.supabase, data.chat_id as string, auth.user.id);
  return { ...auth, message: data as Message };
}

export async function GET(request: Request, context: MessageContext) {
  try {
    const { id } = await context.params; assertUuid(id);
    const { message } = await getOwnedMessage(request, id);
    return Response.json({ data: message });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request, context: MessageContext) {
  try {
    const { id } = await context.params; assertUuid(id);
    const { supabase } = await getOwnedMessage(request, id);
    const body = await readJson<UpdateMessage>(request);
    if (body.role !== undefined && !roles.includes(body.role)) throw new ApiError(400, "Invalid message role.");
    if (body.content !== undefined && (typeof body.content !== "string" || !body.content.trim())) throw new ApiError(400, "Message content must be a non-empty string.");
    if (body.position !== undefined && !Number.isInteger(body.position)) throw new ApiError(400, "Message position must be an integer.");
    if (body.role === undefined && body.content === undefined && body.position === undefined) throw new ApiError(400, "Provide a field to update.");
    const update = { ...body, ...(body.content === undefined ? {} : { content: body.content.trim() }) };
    const { data, error } = await supabase.from("messages").update(update).eq("id", id).select().single();
    assertDatabaseResult(error);
    return Response.json({ data: data as Message });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: MessageContext) {
  try {
    const { id } = await context.params; assertUuid(id);
    const { supabase } = await getOwnedMessage(request, id);
    const { error } = await supabase.from("messages").delete().eq("id", id);
    assertDatabaseResult(error);
    return new Response(null, { status: 204 });
  } catch (error) { return handleApiError(error); }
}
