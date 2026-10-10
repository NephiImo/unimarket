
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Invalid email or password.");
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#fffdfc] px-6 py-10">
            <div className="w-full max-w-md rounded-2xl border border-[#ebc8ba]/60 bg-white p-8 shadow-sm">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#c96f52]">
                        UniMarket
                    </p>

                    <h1 className="text-3xl font-bold text-[#352b28]">
                        Welcome back
                    </h1>

                    <p className="mt-2 text-[#746963]">
                        Sign in to access your UniMarket account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium text-[#352b28]"
                        >
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-[#ebc8ba] bg-[#fffdfc] px-3 py-2.5 text-[#352b28] outline-none placeholder:text-[#746963]/60 focus:border-[#c96f52] focus:ring-2 focus:ring-[#c96f52]/20"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium text-[#352b28]"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            placeholder="Enter your password"
                            className="w-full rounded-lg border border-[#ebc8ba] bg-[#fffdfc] px-3 py-2.5 text-[#352b28] outline-none placeholder:text-[#746963]/60 focus:border-[#c96f52] focus:ring-2 focus:ring-[#c96f52]/20"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#c96f52] px-4 py-2.5 font-semibold text-white transition hover:bg-[#b85f45] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#746963]">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/register"
                        className="font-semibold text-[#c96f52] hover:underline"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </main>
    );
}

