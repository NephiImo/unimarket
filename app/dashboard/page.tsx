export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-gray-50 px-6 py-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Dashboard
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Manage your profile and view your listings.
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
                                placeholder="Your display name"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="contactPreference"
                                className="mb-1 block text-sm font-medium text-gray-700"
                            >
                                Contact Preference
                            </label>

                            <select
                                id="contactPreference"
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Select a contact preference
                                </option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                            </select>
                        </div>

                        <div>
                            <button
                                type="button"
                                disabled
                                className="cursor-not-allowed rounded-md bg-gray-400 px-5 py-2 font-medium text-white"
                            >
                                Save Profile
                            </button>

                            <p className="mt-2 text-sm text-gray-500">
                                Profile updates will be available after
                                authentication is connected.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                My Listings
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                View and manage the items you have listed.
                            </p>
                        </div>

                        <a
                            href="/products/new"
                            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            Add Listing
                        </a>
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