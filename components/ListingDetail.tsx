import type { Listing } from '@/lib/types';

interface ListingDetailProps {
  listing: Listing;
}

const availabilityStyles: Record<Listing['availability'], string> = {
  available: 'bg-[#879B7A] text-white',
  sold: 'bg-[#765C68] text-white',
  reserved: 'bg-[#EBC8BA] text-[#352B28]',
};

export default function ListingDetail({ listing }: ListingDetailProps) {
  const posted = new Date(listing.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#352B28]">{listing.name}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium capitalize ${availabilityStyles[listing.availability]}`}
          >
            {listing.availability}
          </span>
        </div>
        <p className="text-2xl font-semibold text-[#C96F52]">
          ${listing.price.toFixed(2)}
        </p>
      </header>

      <section className="rounded-lg border border-[#E2E8F0] bg-[#FFFFDC] p-6">
        <h2 className="mb-2 text-lg font-semibold text-[#352B28]">
          Description
        </h2>
        <p className="whitespace-pre-line text-[#352B28]">
          {listing.description}
        </p>
      </section>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Category</dt>
          <dd className="font-medium text-[#352B28]">{listing.category}</dd>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Seller</dt>
          <dd className="font-medium text-[#352B28]">{listing.sellerName}</dd>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Posted</dt>
          <dd className="font-medium text-[#352B28]">{posted}</dd>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Listing ID</dt>
          <dd className="font-medium text-[#352B28]">#{listing.id}</dd>
        </div>
      </dl>
    </article>
  );
}