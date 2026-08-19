import OpenAI from "openai";

type ChatRequest = {
	prompt?: unknown;
};

export async function POST(request: Request) {
	let body: ChatRequest;

	try {
		body = (await request.json()) as ChatRequest;
	} catch {
		return Response.json({ error: "Invalid JSON body." }, { status: 400 });
	}

	if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
		return Response.json(
			{ error: "The prompt must be a non-empty string." },
			{ status: 400 },
		);
	}

	const apiKey = process.env.OPENAI_API_KEY;

	if (!apiKey) {
		console.error("OPENAI_API_KEY is not configured.");
		return Response.json(
			{ error: "The AI service is not configured." },
			{ status: 500 },
		);
	}

	try {
		const openai = new OpenAI({ apiKey });
		const result = await openai.responses.create({
			model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
			input: body.prompt.trim(),
		});

		return Response.json({ response: result.output_text });
	} catch (error) {
		console.error("OpenAI request failed:", error);

		if (error instanceof OpenAI.APIError) {
			return Response.json(
				{ error: "The AI service could not complete the request." },
				{
					status:
						error.status >= 400 && error.status < 600 ? error.status : 502,
				},
			);
		}

		return Response.json(
			{ error: "The AI service could not complete the request." },
			{ status: 502 },
		);
	}
}
