
"use client";

import { useState, type FormEvent } from "react";

interface SellerResponseFormProps {
    inquiryId: string;
    existingResponse: string | null;
}

export default function SellerResponseForm({
    inquiryId,
    existingResponse,
}: SellerResponseFormProps) {
    const [response, setResponse] = useState("");
    const [submittedResponse, setSubmittedResponse] = useState(existingResponse);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const message = response.trim();

        if (!message || message.length > 2000) {
            setError("Enter a response between 1 and 2000 characters.");
            return;
        }

        setLoading(true);

        try {
            const result = await fetch(`/api/inquiries/${inquiryId}/response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ response: message }),
            });

            const data = await result.json();

            if (!result.ok) {
                setError(data.error || "Failed to send your response.");
                return;
            }

            setSubmittedResponse(data.seller_response);
            setResponse("");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (submittedResponse) {
        return (
            <div className="mt-5 rounded-lg bg-[#F6F1EA] p-4">
                <h3 className="font-semibold text-[#352B28]">
                    Your response
                </h3>
                <p className="mt-2 whitespace-pre-line text-[#352B28]">
                    {submittedResponse}
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-5 border-t border-[#E2E8F0] pt-4">
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
                maxLength={2000}
                rows={3}
                placeholder="Write a response to the buyer..."
                className="w-full rounded-lg border border-[#E2E8F0] p-3 text-[#352B28] outline-none focus:border-[#C96F52]"
                required
            />

            {error && (
                <p role="alert" className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="mt-3 rounded-lg bg-[#C96F52] px-5 py-2 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading ? "Sending..." : "Send response"}
            </button>
        </form>
    );
}
