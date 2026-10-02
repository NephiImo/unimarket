import Link from "next/link";

type ListingCardProps = {
  id?: string;
  title: string;
  price: string;
  category: string;
  location: string;
  description?: string;
  seller?: string;
  image?: string | null;
};

export default function ListingCard({
  id,
  title,
  price,
  category,
  location,
  description,
  seller,
  image,
}: ListingCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#EBC8BA]/60 bg-[#FFFDFC] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex h-52 items-center justify-center bg-[#F6F1EA]">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-[#746963]">Listing image</span>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-[#FFFDFC]/95 px-3 py-1 text-xs font-semibold text-[#765C68]">
          {category}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-semibold text-[#352B28] transition-colors group-hover:text-[#C96F52]">
            {title}
          </h2>

          <span className="shrink-0 font-semibold text-[#C96F52]">
            {price}
          </span>
        </div>

        {description && (
          <p className="mt-3 line-clamp-2 text-sm text-[#746963]">
            {description}
          </p>
        )}

        <div className="mt-3 space-y-1 text-sm text-[#746963]">
          {seller && <p>Seller: {seller}</p>}
          <p>{location}</p>
        </div>

        <Link
          href={id ? `/listings/${id}` : "/listings"}
          className="mt-5 inline-block w-full rounded-xl border border-[#EBC8BA] px-4 py-2.5 text-center text-sm font-semibold text-[#352B28] transition-colors hover:bg-[#F6F1EA]"
        >
          View Listing
        </Link>
      </div>
    </article>
  );
}