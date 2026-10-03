import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <main className="min-h-screen bg-gray-50 px-6 py-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Welcome, {user.name}.
                    </p>
                </div>

                <section className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900">
                        Profile Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="displayName"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Display Name
                            </label>

                            <input
                                id="displayName"
                                type="text"
                                defaultValue={user.name}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={user.email}
                                readOnly
                                className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            My Listings
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            View and manage the items you have listed.
                        </p>
                    </div>

                    <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
                        <p className="text-gray-600">
                            You do not have any listings yet.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}