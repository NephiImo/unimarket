import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/lib/auth/get-current-user';
import { getCategories, getListingById } from '@/app/lib/listings/queries';
import ListingForm from '@/components/ListingForm';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const user = await getCurrentUser();

  if (!user) redirect('/login');

  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) notFound();

  if (listing.user_id !== user.id) {
    return (
      <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-[#ebc8ba]/60 bg-white p-6">
          <h1 className="text-2xl font-bold text-[#352b28]">
            You cannot edit this listing
          </h1>
          <p className="mt-3 text-[#746963]">
            Only the person who posted this listing can make changes.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-block font-medium text-[#C96F52] hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const categories = await getCategories();

  return (
    <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/listings/${listing.id}`}
          className="mb-6 inline-block text-sm font-medium text-[#C96F52] hover:underline"
        >
          Back to listing
        </Link>
        <section className="rounded-xl border border-[#ebc8ba]/60 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="mb-2 text-3xl font-bold text-[#352b28]">
            Edit listing
          </h1>
          <p className="mb-6 text-[#746963]">
            Update your item details and availability.
          </p>
          <ListingForm
            categories={categories.map(({ id: categoryId, name }) => ({
              id: categoryId,
              name,
            }))}
            listing={{
              id: listing.id,
              categoryId: listing.category_id,
              title: listing.title,
              description: listing.description,
              price: Number(listing.price),
              imageUrl: listing.image_url,
              location: listing.location,
              status: listing.status,
            }}
          />
        </section>
      </div>
    </main>
  );
}
