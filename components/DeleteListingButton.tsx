'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DeleteListingButtonProps {
  listingId: string;
  title: string;
}

export default function DeleteListingButton({
  listingId,
  title,
}: DeleteListingButtonProps) {
  const router = useRouter();
  const pending = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);

  async function handleDelete() {
    if (
      pending.current ||
      !window.confirm(
        `Delete “${title}”? This listing will be removed from the marketplace.`
      )
    ) {
      return;
    }

    pending.current = true;
    setDeleting(true);
    setError('');
    setRequiresLogin(false);

    try {
      const response = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        setRequiresLogin(response.status === 401);
        const messages: Record<number, string> = {
          401: 'Your session has expired. Log in to delete this listing.',
          403: 'You do not have permission to delete this listing.',
          404: 'This listing is no longer available. Refresh the page to update your listings.',
        };
        setError(
          messages[response.status] ??
            'We couldn’t delete this listing. Please try again.'
        );
        pending.current = false;
        setDeleting(false);
        return;
      }

      router.replace('/dashboard?deleted=1');
      router.refresh();
    } catch {
      setError('We couldn’t connect. Check your connection and try again.');
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${title}`}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
      {deleting && (
        <p role="status" className="mt-2 text-sm text-gray-600">
          Deleting listing…
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 max-w-sm text-sm text-red-700">
          {error}{' '}
          {requiresLogin && (
            <Link href="/login" className="underline">
              Log in
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
