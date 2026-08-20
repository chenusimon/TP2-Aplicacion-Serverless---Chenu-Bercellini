import type { Chat, UpdateChat } from "@/backend/model";
import { ApiError, assertDatabaseResult, assertUuid, getAuthenticatedSupabase, handleApiError, readJson } from "@/backend/lib/api";

type ChatContext = { params: Promise<{ chatId: string }> };

export async function GET(request: Request, context: ChatContext) {
  try {
    const { chatId } = await context.params; assertUuid(chatId);
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const { data, error } = await supabase.from("chats").select("*").eq("id", chatId).eq("user_id", user.id).maybeSingle();
    assertDatabaseResult(error); if (!data) throw new ApiError(404, "Chat not found.");
    return Response.json({ data: data as Chat });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request, context: ChatContext) {
  try {
    const { chatId } = await context.params; assertUuid(chatId);
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const body = await readJson<UpdateChat>(request);
    if (!("title" in body) || (body.title !== null && typeof body.title !== "string")) throw new ApiError(400, "The title must be a string or null.");
    const { data, error } = await supabase.from("chats").update({ title: body.title, updated_at: new Date().toISOString() })
      .eq("id", chatId).eq("user_id", user.id).select().maybeSingle();
    assertDatabaseResult(error); if (!data) throw new ApiError(404, "Chat not found.");
    return Response.json({ data: data as Chat });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: ChatContext) {
  try {
    const { chatId } = await context.params; assertUuid(chatId);
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const { data, error } = await supabase.from("chats").delete().eq("id", chatId).eq("user_id", user.id).select("id").maybeSingle();
    assertDatabaseResult(error); if (!data) throw new ApiError(404, "Chat not found.");
    return new Response(null, { status: 204 });
  } catch (error) { return handleApiError(error); }
}
