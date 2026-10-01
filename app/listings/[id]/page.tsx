import Link from "next/link";
import { notFound } from "next/navigation";
import ListingDetail from "@/components/ListingDetail";
import { getListingById } from "@/app/lib/listings/queries";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;

  const listing = await getListingById(id);

  if (!listing) {
    notFound();
  }

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
      </div>
    </main>
  );
}