
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getListingsByUserId, type Listing } from "@/app/lib/listings/queries";
import DeleteListingButton from "@/components/DeleteListingButton";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ deleted?: string }>;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const { deleted } = await searchParams;
    let listings: Listing[] = [];
    let listingsUnavailable = false;
    try {
        listings = await getListingsByUserId(user.id);
    } catch (error) {
        console.error("Failed to fetch dashboard listings:", error);
        listingsUnavailable = true;
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
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                My Listings
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage the items you have listed.
                            </p>
                        </div>

                        <Link
                            href="/listings/new"
                            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            Add Listing
                        </Link>
                    </div>

                    {deleted === "1" && (
                        <p role="status" className="mb-4 rounded-md bg-green-50 p-3 text-green-800">
                            Your listing was deleted successfully.
                        </p>
                    )}

                    {listingsUnavailable ? (
                        <div role="alert" className="rounded-md bg-red-50 p-4 text-red-800">
                            <p>We couldn’t load your listings. Please try again.</p>
                            <Link href="/dashboard" className="mt-2 inline-block font-medium underline">
                                Reload listings
                            </Link>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
                            <p className="text-gray-600">You do not have any listings yet.</p>
                            <Link href="/listings/new" className="mt-3 inline-block font-medium text-[#C96F52] underline">
                                Create your first listing
                            </Link>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {listings.map((listing) => (
                                <li key={listing.id} className="rounded-lg border border-gray-200 p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <Link href={`/listings/${listing.id}`} className="break-words text-lg font-semibold text-gray-900 hover:underline">
                                                {listing.title}
                                            </Link>
                                            <p className="mt-1 text-sm text-gray-600">
                                                {listing.category_name} · {listing.location}
                                            </p>
                                            <p className="mt-2 font-medium text-[#C96F52]">
                                                ₦{Number(listing.price).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <span className="self-start rounded-full bg-gray-100 px-3 py-1 text-sm capitalize text-gray-700">
                                            {listing.status}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-start gap-3">
                                        <Link href={`/listings/${listing.id}`} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                                            Open
                                        </Link>
                                        <Link href={`/listings/${listing.id}/edit`} className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
                                            Edit
                                        </Link>
                                        <DeleteListingButton listingId={listing.id} title={listing.title} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}
