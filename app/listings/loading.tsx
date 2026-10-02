export default function ListingsLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-9 w-56 animate-pulse rounded bg-[#EBC8BA]" />
        <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded bg-[#F0E6DF]" />
      </div>

      <div className="mb-8 h-28 animate-pulse rounded-2xl bg-[#FFFDFC]" />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl bg-[#FFFDFC]"
          />
        ))}
      </div>
    </main>
  );
}