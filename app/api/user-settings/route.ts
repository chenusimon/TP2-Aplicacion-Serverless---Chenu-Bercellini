import type { CreateUserSettings, UpdateUserSettings, UserSettings } from "@/backend/model";
import { ApiError, assertDatabaseResult, getAuthenticatedSupabase, handleApiError, readJson } from "@/backend/lib/api";

function validate(body: UpdateUserSettings, all = false) {
  const dark = typeof body.dark_mode === "boolean";
  const history = typeof body.save_history === "boolean";
  if ((body.dark_mode !== undefined && !dark) || (body.save_history !== undefined && !history) ||
      (all && (!dark || !history)) || (!all && body.dark_mode === undefined && body.save_history === undefined)) {
    throw new ApiError(400, "Provide valid dark_mode or save_history values.");
  }
}

export async function GET(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
    assertDatabaseResult(error);
    if (!data) throw new ApiError(404, "User settings not found.");
    return Response.json({ data: data as UserSettings });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const body = await readJson<CreateUserSettings>(request);
    validate(body, true);
    const { data, error } = await supabase.from("user_settings").insert({ ...body, user_id: user.id }).select().single();
    assertDatabaseResult(error);
    return Response.json({ data: data as UserSettings }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const body = await readJson<UpdateUserSettings>(request);
    validate(body);
    const { data, error } = await supabase.from("user_settings")
      .update({ ...body, updated_at: new Date().toISOString() }).eq("user_id", user.id).select().maybeSingle();
    assertDatabaseResult(error);
    if (!data) throw new ApiError(404, "User settings not found.");
    return Response.json({ data: data as UserSettings });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedSupabase(request);
    const { data, error } = await supabase.from("user_settings").delete().eq("user_id", user.id).select("id").maybeSingle();
    assertDatabaseResult(error);
    if (!data) throw new ApiError(404, "User settings not found.");
    return new Response(null, { status: 204 });
  } catch (error) { return handleApiError(error); }
}
