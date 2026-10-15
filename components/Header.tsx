import Link from "next/link";
import AuthButton from "./AuthButton";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";

export default async function Header() {
    const user = await getCurrentUser();

    return (
        <header className="border-b border-[#EBC8BA] bg-[#FFFDFC]">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <Link
                    href="/"
                    className="text-2xl font-bold tracking-tight text-[#352B28] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
                >
                    UniMarket
                </Link>

                <nav
                    aria-label="Main navigation"
                    className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#352B28]"
                >
                    <Link
                        href="/"
                        className="transition-colors hover:text-[#783322] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
                    >
                        Home
                    </Link>

                    <Link
                        href="/listings"
                        className="transition-colors hover:text-[#783322] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
                    >
                        Browse
                    </Link>

                    <Link
                        href="/dashboard"
                        className="transition-colors hover:text-[#783322] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/listings/new"
                        className="rounded-lg bg-[#783322] px-4 py-2 text-[#FFFDFC] transition-colors hover:bg-[#5C2618] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#352B28]"
                    >
                        Sell an Item
                    </Link>

                    <AuthButton isLoggedIn={!!user} />
                </nav>
            </div>
        </header>
    );
}
