import type { Listing } from "@/app/lib/listings/queries";

interface ListingDetailProps {
  listing: Listing;
}

export default function ListingDetail({ listing }: ListingDetailProps) {
  const posted = new Date(listing.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#352B28]">
            {listing.title}
          </h1>

          <span className="shrink-0 rounded-full bg-[#879B7A] px-3 py-1 text-sm font-medium capitalize text-white">
            {listing.status}
          </span>
        </div>

        <p className="text-2xl font-semibold text-[#C96F52]">
          ₦{Number(listing.price).toLocaleString()}
        </p>
      </header>

      <section className="rounded-lg border border-[#E2E8F0] bg-[#FFFDFC] p-6">
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
          <dd className="font-medium text-[#352B28]">
            {listing.category_name ?? "Uncategorized"}
          </dd>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Seller</dt>
          <dd className="font-medium text-[#352B28]">
            {listing.seller_name ?? "Unknown seller"}
          </dd>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Location</dt>
          <dd className="font-medium text-[#352B28]">
            {listing.location}
          </dd>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4">
          <dt className="text-sm text-[#64748B]">Posted</dt>
          <dd className="font-medium text-[#352B28]">
            {posted}
          </dd>
        </div>
      </dl>
    </article>
  );
}