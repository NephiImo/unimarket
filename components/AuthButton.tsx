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
                className="rounded-lg border border-[#C96F52] px-4 py-2 text-[#783322] hover:bg-[#5C2618] hover:text-[#FFFDFC] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
            >
                Sign In
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[#C96F52] px-4 py-2 text-[#783322] hover:bg-[#5C2618] hover:text-[#FFFDFC] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
        >
            Sign Out
        </button>
    );
}
