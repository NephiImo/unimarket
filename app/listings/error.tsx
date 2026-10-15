"use client";

export default function ListingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[#EBC8BA] bg-[#FFFDFC] p-10 text-center">
        <h1 className="text-2xl font-bold text-[#352B28]">
          Something went wrong
        </h1>

        <p className="mt-3 text-[#514741]">
          We couldn&apos;t load the listings right now. Please try again.
        </p>

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-[#783322] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#5C2618]"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
