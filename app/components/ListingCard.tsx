type ListingCardProps = {
  title: string;
  price: string;
  category: string;
  location: string;
  image?: string;
};

export default function ListingCard({
  title,
  price,
  category,
  location,
  image,
}: ListingCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#ebc8ba]/60 bg-[#fffdfc] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex h-52 items-center justify-center bg-[#f6f1ea]">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm text-[#746963]">Listing image</span>
        )}

        <span className="absolute left-4 top-4 rounded-full bg-[#fffdfc]/95 px-3 py-1 text-xs font-semibold text-[#765c68]">
          {category}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-[#352b28] transition-colors group-hover:text-[#c96f52]">
            {title}
          </h3>

          <span className="shrink-0 font-semibold text-[#c96f52]">
            {price}
          </span>
        </div>

        <p className="mt-3 text-sm text-[#746963]">{location}</p>

        <button
          type="button"
          className="mt-5 w-full rounded-xl border border-[#ebc8ba] px-4 py-2.5 text-sm font-semibold text-[#352b28] transition-colors hover:bg-[#f6f1ea]"
        >
          View Listing
        </button>
      </div>
    </article>
  );
}