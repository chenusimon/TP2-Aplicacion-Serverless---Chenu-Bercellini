import type { Chat, CreateChat } from "@/backend/model";
import { ApiError, assertDatabaseResult, getAuthenticatedSupabase, handleApiError, readJson } from "@/backend/lib/api";

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const { data, error } = await supabase.from("chats").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    assertDatabaseResult(error);
    return Response.json({ data: data as Chat[] });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const body = await readJson<CreateChat>(request);
    if (body.title !== null && typeof body.title !== "string") throw new ApiError(400, "The title must be a string or null.");
    const { data, error } = await supabase.from("chats").insert({ user_id: user.id, title: body.title }).select().single();
    assertDatabaseResult(error);
    return Response.json({ data: data as Chat }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
