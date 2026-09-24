import Link from 'next/link';
import { notFound } from 'next/navigation';
import ListingDetail from '@/components/ListingDetail';
import { getListingById } from '@/lib/listings-db';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    notFound();
  }

  const listing = await getListingById(numericId);

  if (!listing) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/products"
          className="mb-6 inline-block text-sm font-medium text-[#C96F52] hover:underline"
        >
          ← Back to listings
        </Link>
        <ListingDetail listing={listing} />
      </div>
    </main>
  );
}