
import Link from "next/link";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/ListingDetail";
import InquiryForm from "@/components/InquiryForm";
import { getListingById } from "@/app/lib/listings/queries";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";

interface ListingPageProps {
    params: Promise<{ id: string }>;
}

export default async function ListingPage({
    params,
}: ListingPageProps) {
    const { id } = await params;
    const listing = await getListingById(id);

    if (!listing) {
        notFound();
    }

    const user = await getCurrentUser();

    const canInquire =
        listing.status === "active" &&
        user !== null &&
        user.id !== listing.user_id;

    return (
        <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/listings"
                    className="mb-6 inline-block text-sm font-medium text-[#C96F52] hover:underline"
                >
                    ← Back to listings
                </Link>

                <ListingDetail listing={listing} />

                {canInquire && (
                    <InquiryForm listingId={listing.id} />
                )}

                {listing.status === "active" && !user && (
                    <div className="mt-8 rounded-lg bg-white p-6">
                        <p className="text-[#352B28]">
                            Please log in to contact the seller.
                        </p>

                        <Link
                            href="/login"
                            className="mt-3 inline-block font-medium text-[#C96F52] hover:underline"
                        >
                            Log in
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
