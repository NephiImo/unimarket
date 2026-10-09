"use client";

import { useRouter } from "next/navigation";

type AuthButtonProps = {
    isLoggedIn: boolean;
};

export default function AuthButton({ isLoggedIn }: AuthButtonProps) {
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/auth/logout", {
            method: "POST",
        });

        router.push("/");
        router.refresh();
    }

    if (!isLoggedIn) {
        return (
            <button
                type="button"
                onClick={() => router.push("/login")}
                className="rounded-lg border border-[#C96F52] px-4 py-2 text-[#C96F52] transition-colors hover:bg-[#C96F52] hover:text-[#FFFDFC]"
            >
                Sign In
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[#C96F52] px-4 py-2 text-[#C96F52] transition-colors hover:bg-[#C96F52] hover:text-[#FFFDFC]"
        >
            Sign Out
        </button>
    );
}