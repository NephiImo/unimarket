"use client";

import { FormEvent, useState } from "react";

interface InquiryFormProps {
  listingId: string;
}

const MAX_MESSAGE_LENGTH = 1000;

export default function InquiryForm({ listingId }: InquiryFormProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      setError("Please enter a message.");
      setStatus("error");
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
      setStatus("error");
      return;
    }

    setStatus("sending");
    setError("");

    try {
      const response = await fetch(`/api/listings/${listingId}/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send inquiry.");
      }

      setMessage("");
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send inquiry.",
      );
      setStatus("error");
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-[#E2E8F0] bg-white p-6">
      <h2 className="text-lg font-semibold text-[#352B28]">
        Contact the seller
      </h2>

      <p className="mt-1 text-sm text-[#64748B]">
        Send a message about this listing.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="inquiry-message"
            className="mb-2 block text-sm font-medium text-[#352B28]"
          >
            Message
          </label>

          <textarea
            id="inquiry-message"
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);

              if (status !== "sending") {
                setStatus("idle");
                setError("");
              }
            }}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={5}
            required
            className="w-full rounded-md border border-[#CBD5E1] px-3 py-2 text-[#352B28] outline-none focus:border-[#C96F52]"
            placeholder="Hi, I'm interested in this item..."
          />

          <p className="mt-1 text-right text-xs text-[#64748B]">
            {message.length}/{MAX_MESSAGE_LENGTH}
          </p>
        </div>

        {status === "error" && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {status === "success" && (
          <p role="status" className="text-sm text-green-700">
            Your inquiry was sent successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-md bg-[#C96F52] px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Sending..." : "Send inquiry"}
        </button>
      </form>
    </section>
  );
}