'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';
import {
  LISTING_LIMITS,
  LISTING_STATUSES,
  type ListingFieldErrors,
  validateListingInput,
} from '@/app/lib/listings/validation';

type EditableListing = {
  id: string;
  categoryId: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  location: string;
  status: string;
};

interface ListingFormProps {
  categories: { id: number; name: string }[];
  listing?: EditableListing;
}

const fields = [
  'title',
  'description',
  'price',
  'categoryId',
  'location',
  'imageUrl',
  'status',
] as const;

const inputClassName =
  'w-full rounded-lg border border-[#ebc8ba] bg-[#fffdfc] px-3 py-2.5 text-[#352b28] outline-none focus:border-[#c96f52] focus:ring-2 focus:ring-[#c96f52]/30 aria-invalid:border-red-500 disabled:opacity-60';
const labelClassName = 'mb-1 block text-sm font-medium text-[#352b28]';

function FieldError({ name, message }: { name: string; message?: string }) {
  return message ? (
    <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  ) : null;
}

function getFieldErrors(payload: unknown): ListingFieldErrors {
  if (!payload || typeof payload !== 'object' || !('errors' in payload)) {
    return {};
  }

  const errors = payload.errors;
  if (!errors || typeof errors !== 'object') return {};

  const result: ListingFieldErrors = {};
  for (const field of fields) {
    const message = (errors as Record<string, unknown>)[field];
    if (typeof message === 'string' && message.length <= 200) {
      result[field] = message;
    }
  }
  return result;
}

export default function ListingForm({ categories, listing }: ListingFormProps) {
  const router = useRouter();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<ListingFieldErrors>({});
  const [message, setMessage] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const isEditing = Boolean(listing);

  function errorAttributes(name: (typeof fields)[number]) {
    return {
      'aria-invalid': errors[name] ? true : undefined,
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    };
  }

  function showValidationErrors(
    form: HTMLFormElement,
    nextErrors: ListingFieldErrors
  ) {
    setErrors(nextErrors);
    setMessage('Please correct the highlighted fields and try again.');
    const firstField = fields.find((field) => nextErrors[field]);
    const control = firstField ? form.elements.namedItem(firstField) : null;
    if (control instanceof HTMLElement) {
      requestAnimationFrame(() => control.focus());
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const price = String(formData.get('price') ?? '').trim();
    const result = validateListingInput({
      title: formData.get('title'),
      description: formData.get('description'),
      price: price ? Number(price) : Number.NaN,
      categoryId: Number(formData.get('categoryId')),
      location: formData.get('location'),
      imageUrl: formData.get('imageUrl'),
      status: formData.get('status'),
    });

    setNeedsLogin(false);
    if (!result.data) {
      showValidationErrors(form, result.errors);
      return;
    }

    if (
      !categories.some((category) => category.id === result.data?.categoryId)
    ) {
      showValidationErrors(form, {
        categoryId: 'Choose an available category.',
      });
      return;
    }

    submitting.current = true;
    setPending(true);
    setErrors({});
    setMessage('');
    let navigating = false;

    try {
      const response = await fetch(
        listing
          ? `/api/listings/${encodeURIComponent(listing.id)}`
          : '/api/listings',
        {
          method: listing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data),
        }
      );
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400) {
          const fieldErrors = getFieldErrors(payload);
          if (Object.keys(fieldErrors).length) {
            showValidationErrors(form, fieldErrors);
          } else {
            setMessage('Please check your listing details and try again.');
          }
        } else if (response.status === 401) {
          setNeedsLogin(true);
          setMessage(
            'Your session has expired. Sign in again before saving your listing.'
          );
        } else if (response.status === 403) {
          setMessage('You do not have permission to edit this listing.');
        } else if (response.status === 404) {
          setMessage(
            'This listing is no longer available. Return to your dashboard.'
          );
        } else {
          setMessage(
            'We could not save your listing. Please try again shortly.'
          );
        }
        return;
      }

      const id =
        payload && typeof payload === 'object' && 'id' in payload
          ? payload.id
          : null;
      if (typeof id !== 'string' || !id) {
        setMessage(
          'We could not confirm the save. Check your dashboard before trying again.'
        );
        return;
      }

      router.replace(`/listings/${encodeURIComponent(id)}`);
      router.refresh();
      navigating = true;
    } catch {
      setMessage(
        'We could not connect to UniMarket. Check your connection and try again.'
      );
    } finally {
      if (!navigating) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  if (!categories.length) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900"
      >
        No categories are available yet. Please try again later.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={pending}
      className="space-y-5"
    >
      <p className="text-sm text-[#746963]">
        All fields are required except the image URL.
      </p>

      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Listing details</legend>
        <div>
          <label htmlFor="title" className={labelClassName}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={listing?.title ?? ''}
            required
            maxLength={LISTING_LIMITS.title}
            className={inputClassName}
            {...errorAttributes('title')}
          />
          <FieldError name="title" message={errors.title} />
        </div>

        <div>
          <label htmlFor="description" className={labelClassName}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={listing?.description ?? ''}
            required
            maxLength={LISTING_LIMITS.description}
            rows={6}
            className={inputClassName}
            {...errorAttributes('description')}
          />
          <FieldError name="description" message={errors.description} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className={labelClassName}>
              Price (NGN)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              defaultValue={listing?.price ?? ''}
              required
              min="0"
              max={LISTING_LIMITS.maxPrice}
              step="0.01"
              className={inputClassName}
              {...errorAttributes('price')}
            />
            <FieldError name="price" message={errors.price} />
          </div>

          <div>
            <label htmlFor="categoryId" className={labelClassName}>
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={listing?.categoryId ?? ''}
              required
              className={inputClassName}
              {...errorAttributes('categoryId')}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError name="categoryId" message={errors.categoryId} />
          </div>
        </div>

        <div>
          <label htmlFor="location" className={labelClassName}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={listing?.location ?? ''}
            required
            maxLength={LISTING_LIMITS.location}
            className={inputClassName}
            {...errorAttributes('location')}
          />
          <FieldError name="location" message={errors.location} />
        </div>

        <div>
          <label htmlFor="imageUrl" className={labelClassName}>
            Image URL (optional)
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={listing?.imageUrl ?? ''}
            maxLength={LISTING_LIMITS.imageUrl}
            placeholder="https://example.com/image.jpg"
            className={inputClassName}
            {...errorAttributes('imageUrl')}
          />
          <FieldError name="imageUrl" message={errors.imageUrl} />
        </div>

        <div>
          <label htmlFor="status" className={labelClassName}>
            Availability status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={listing?.status ?? 'active'}
            required
            className={inputClassName}
            {...errorAttributes('status')}
          >
            {LISTING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === 'active'
                  ? 'Active (available)'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <FieldError name="status" message={errors.status} />
        </div>
      </fieldset>

      {message && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          <p>{message}</p>
          {needsLogin && (
            <Link
              href="/login"
              className="mt-1 inline-block font-medium underline"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#c96f52] px-5 py-2.5 font-semibold text-white hover:bg-[#b85f45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c96f52] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? 'Saving...'
            : isEditing
              ? 'Save changes'
              : 'Create listing'}
        </button>
        <Link
          href={listing ? `/listings/${listing.id}` : '/dashboard'}
          className="rounded px-2 py-2 text-sm font-medium text-[#746963] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c96f52]"
        >
          Cancel
        </Link>
        <span className="sr-only" role="status">
          {pending ? 'Saving your listing. Please wait.' : ''}
        </span>
      </div>
    </form>
  );
}
