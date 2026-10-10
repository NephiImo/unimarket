import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/auth/get-current-user';
import { getCategories } from '@/app/lib/listings/queries';
import ListingForm from '@/components/ListingForm';

export default async function NewListingPage() {
  const user = await getCurrentUser();

  if (!user) redirect('/login');

  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-block text-sm font-medium text-[#C96F52] hover:underline"
        >
          Back to dashboard
        </Link>
        <section className="rounded-xl border border-[#ebc8ba]/60 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="mb-2 text-3xl font-bold text-[#352b28]">
            Create a listing
          </h1>
          <p className="mb-6 text-[#746963]">
            Share the details of the item you want to sell.
          </p>
          <ListingForm
            categories={categories.map(({ id, name }) => ({ id, name }))}
          />
        </section>
      </div>
    </main>
  );
}
