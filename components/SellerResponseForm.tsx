'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  INQUIRY_MESSAGE_LIMIT,
  validateInquiryText,
} from '@/app/lib/inquiries/validation';

interface SellerResponseFormProps {
  inquiryId: string;
  existingResponse: string | null;
}

export default function SellerResponseForm({
  inquiryId,
  existingResponse,
}: SellerResponseFormProps) {
  return (
    <ResponseForm
      key={inquiryId}
      inquiryId={inquiryId}
      existingResponse={existingResponse}
    />
  );
}

function ResponseForm({
  inquiryId,
  existingResponse,
}: SellerResponseFormProps) {
  const [response, setResponse] = useState('');
  const [submittedResponse, setSubmittedResponse] = useState(existingResponse);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const visibleResponse = existingResponse ?? submittedResponse;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mounted.current || requestRef.current || visibleResponse) return;
    setError('');

    const { value: message, error: validationError } = validateInquiryText(
      { response },
      'response'
    );
    if (!message) {
      setError(validationError ?? 'Enter a response before sending.');
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);

    try {
      const result = await fetch(
        `/api/inquiries/${encodeURIComponent(inquiryId)}/response`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ response: message }),
        }
      );

      const data = await result.json();
      if (
        !mounted.current ||
        requestRef.current !== controller ||
        controller.signal.aborted
      )
        return;

      if (!result.ok) {
        setError(
          result.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'Failed to send your response. Please try again.'
        );
        return;
      }

      setSubmittedResponse(data.seller_response);
      setResponse('');
    } catch {
      if (
        mounted.current &&
        requestRef.current === controller &&
        !controller.signal.aborted
      ) {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      if (mounted.current && requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  if (visibleResponse) {
    return (
      <div role="status" className="mt-5 rounded-lg bg-[#F6F1EA] p-4">
        <h3 className="font-semibold text-[#352B28]">Your response</h3>
        <p className="mt-2 whitespace-pre-line text-[#352B28]">
          {visibleResponse}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 border-t border-[#E2E8F0] pt-4"
    >
      <label
        htmlFor={`response-${inquiryId}`}
        className="mb-2 block font-semibold text-[#352B28]"
      >
        Reply to this inquiry
      </label>

      <textarea
        id={`response-${inquiryId}`}
        value={response}
        onChange={(event) => setResponse(event.target.value)}
        maxLength={INQUIRY_MESSAGE_LIMIT}
        disabled={loading}
        rows={3}
        placeholder="Write a response to the buyer..."
        className="w-full rounded-lg border border-[#E2E8F0] p-3 text-[#352B28] outline-none placeholder:text-[#514741] focus:border-[#783322] focus:ring-2 focus:ring-[#783322]"
        required
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-3 rounded-lg bg-[#783322] px-5 py-2 font-semibold text-white hover:bg-[#5C2618] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#783322] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Sending...' : 'Send response'}
      </button>
    </form>
  );
}
