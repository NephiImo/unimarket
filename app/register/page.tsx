"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to create account.");
                return;
            }

            window.location.href = "/login";
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#FFFDFC] px-6 py-10">
            <div className="w-full max-w-md rounded-2xl border border-[#EBC8BA]/60 bg-white p-8 shadow-sm">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#783322]">
                        UniMarket
                    </p>

                    <h1 className="text-3xl font-bold text-[#352B28]">
                        Create an account
                    </h1>

                    <p className="mt-2 text-[#514741]">
                        Join UniMarket and start buying and selling on campus.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="name"
                            className="mb-1 block text-sm font-medium text-[#352B28]"
                        >
                            Name
                        </label>

                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            placeholder="Your name"
                            className="w-full rounded-lg border border-[#EBC8BA] bg-[#FFFDFC] px-3 py-2.5 text-[#352B28] outline-none placeholder:text-[#514741] focus:border-[#783322] focus:ring-2 focus:ring-[#783322]"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium text-[#352B28]"
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
                            className="w-full rounded-lg border border-[#EBC8BA] bg-[#FFFDFC] px-3 py-2.5 text-[#352B28] outline-none placeholder:text-[#514741] focus:border-[#783322] focus:ring-2 focus:ring-[#783322]"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium text-[#352B28]"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            placeholder="Create a password"
                            className="w-full rounded-lg border border-[#EBC8BA] bg-[#FFFDFC] px-3 py-2.5 text-[#352B28] outline-none placeholder:text-[#514741] focus:border-[#783322] focus:ring-2 focus:ring-[#783322]"
                        />
                    </div>

                    {error && (
                        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#783322] px-4 py-2.5 font-semibold text-[#FFFDFC] transition-colors hover:bg-[#5C2618] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#783322] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#514741]">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-[#783322] hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </main>
    );
}
