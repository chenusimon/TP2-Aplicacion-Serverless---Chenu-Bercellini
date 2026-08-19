import type { CreateMessage, Message, MessageRole } from "@/backend/model";
import { ApiError, assertChatOwner, assertDatabaseResult, assertUuid, getAuthenticatedSupabase, handleApiError, readJson } from "@/backend/lib/api";

const roles: MessageRole[] = ["user", "assistant", "system"];
type ChatMessagesContext = { params: Promise<{ chatId: string }> };

export async function GET(request: Request, context: ChatMessagesContext) {
  try {
    const { chatId } = await context.params; assertUuid(chatId);
    const { supabase, user } = await getAuthenticatedSupabase(request);
    await assertChatOwner(supabase, chatId, user.id);
    const { data, error } = await supabase.from("messages").select("*").eq("chat_id", chatId).order("position");
    assertDatabaseResult(error);
    return Response.json({ data: data as Message[] });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: ChatMessagesContext) {
  try {
    const { chatId } = await context.params; assertUuid(chatId);
    const { supabase, user } = await getAuthenticatedSupabase(request);
    await assertChatOwner(supabase, chatId, user.id);
    const body = await readJson<CreateMessage>(request);
    if (!roles.includes(body.role)) throw new ApiError(400, "Invalid message role.");
    if (typeof body.content !== "string" || !body.content.trim()) throw new ApiError(400, "Message content is required.");
    if (!Number.isInteger(body.position)) throw new ApiError(400, "Message position must be an integer.");
    const { data, error } = await supabase.from("messages")
      .insert({ ...body, content: body.content.trim(), chat_id: chatId }).select().single();
    assertDatabaseResult(error);
    return Response.json({ data: data as Message }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
