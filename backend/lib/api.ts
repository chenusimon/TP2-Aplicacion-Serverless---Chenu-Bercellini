import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export class ApiError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message);
	}
}

export async function getAuthenticatedSupabase(request: Request): Promise<{
	supabase: SupabaseClient;
	user: User;
}> {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anonKey) throw new ApiError(500, "The database is not configured.");

	const authorization = request.headers.get("authorization");
	if (!authorization?.startsWith("Bearer ")) {
		throw new ApiError(401, "Authentication is required.");
	}

	const token = authorization.slice(7).trim();
	const supabase = createClient(url, anonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } },
	});
	const { data, error } = await supabase.auth.getUser(token);
	if (error || !data.user) throw new ApiError(401, "The access token is invalid or expired.");
	return { supabase, user: data.user };
}

export async function readJson<T>(request: Request): Promise<T> {
	try {
		return (await request.json()) as T;
	} catch {
		throw new ApiError(400, "Invalid JSON body.");
	}
}

export function handleApiError(error: unknown): Response {
	if (error instanceof ApiError) {
		return Response.json({ error: error.message }, { status: error.status });
	}
	console.error("API request failed:", error);
	return Response.json({ error: "Unexpected server error." }, { status: 500 });
}

export function assertDatabaseResult(error: { message: string } | null): void {
	if (error) throw new ApiError(400, error.message);
}

export function assertUuid(value: string): void {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
		throw new ApiError(400, "Invalid resource id.");
	}
}

export async function assertChatOwner(
	supabase: SupabaseClient,
	chatId: string,
	userId: string,
): Promise<void> {
	const { data, error } = await supabase
		.from("chats")
		.select("id")
		.eq("id", chatId)
		.eq("user_id", userId)
		.maybeSingle();
	assertDatabaseResult(error);
	if (!data) throw new ApiError(404, "Chat not found.");
}
