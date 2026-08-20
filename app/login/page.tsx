"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const router = useRouter();
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setMessage("");

		try {
			const supabase = getSupabaseClient();

			if (isSignUp) {
				const { data, error } = await supabase.auth.signUp({ email, password });
				if (error) throw error;

				if (!data.session) {
					setMessage("Account created. Check your email to confirm it, then sign in.");
					setIsSignUp(false);
					return;
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) throw error;
			}

			router.replace("/");
			router.refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Authentication failed.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className="grid min-h-dvh place-items-center bg-[#f8f8f6] px-5 py-10 text-[#20201f]">
			<section className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 grid size-11 place-items-center rounded-2xl bg-[#20201f] text-base font-semibold text-white">A</div>
					<h1 className="text-2xl font-semibold tracking-[-0.03em]">{isSignUp ? "Create your account" : "Welcome back"}</h1>
					<p className="mt-2 text-sm text-black/50">{isSignUp ? "Sign up to start using Askly." : "Sign in to continue to Askly."}</p>
				</div>

				<form onSubmit={handleSubmit} className="rounded-3xl border border-black/8 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
					<label className="block text-sm font-medium" htmlFor="email">Email</label>
					<input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 text-sm outline-none transition focus:border-black/30 focus:ring-3 focus:ring-black/5" />

					<label className="mt-5 block text-sm font-medium" htmlFor="password">Password</label>
					<input id="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="mt-2 h-11 w-full rounded-xl border border-black/10 bg-[#fafaf8] px-3.5 text-sm outline-none transition focus:border-black/30 focus:ring-3 focus:ring-black/5" />

					{message && <p role="status" className="mt-4 rounded-xl bg-black/5 px-3 py-2.5 text-sm leading-5 text-black/65">{message}</p>}

					<button type="submit" disabled={loading} className="mt-6 h-11 w-full rounded-xl bg-[#20201f] text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50">
						{loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
					</button>
				</form>

				<p className="mt-5 text-center text-sm text-black/50">
					{isSignUp ? "Already have an account?" : "Need an account?"}{" "}
					<button type="button" onClick={() => { setIsSignUp((value) => !value); setMessage(""); }} className="font-medium text-black underline decoration-black/25 underline-offset-4">
						{isSignUp ? "Sign in" : "Create one"}
					</button>
				</p>
			</section>
		</main>
	);
}
