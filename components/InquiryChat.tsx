"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Message = {
    id: string;
    inquiry_id: string;
    sender_id: string;
    sender_name?: string;
    message: string;
    created_at: string;
};

type InquiryChatProps = {
    inquiryId: string;
    currentUserId: string;
};

export default function InquiryChat({
    inquiryId,
    currentUserId,
}: InquiryChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const loadMessages = useCallback(async () => {
        try {
            const result = await fetch(
                `/api/inquiries/${inquiryId}/messages`,
                { cache: "no-store" },
            );

            const data = await result.json();

            if (!result.ok) {
                setError(data.error || "Could not load messages.");
                return;
            }

            setMessages(data);
            setError("");
        } catch {
            setError("Could not load messages. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [inquiryId]);

    useEffect(() => {
        void loadMessages();

        const interval = setInterval(() => {
            void loadMessages();
        }, 5000);

        return () => clearInterval(interval);
    }, [loadMessages]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const text = message.trim();

        if (!text || text.length > 2000 || sending) {
            return;
        }

        setSending(true);
        setError("");

        try {
            const result = await fetch(
                `/api/inquiries/${inquiryId}/messages`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ message: text }),
                },
            );

            const data = await result.json();

            if (!result.ok) {
                setError(data.error || "Could not send message.");
                return;
            }

            setMessage("");
            await loadMessages();
        } catch {
            setError("Message could not be sent. Please try again.");
        } finally {
            setSending(false);
        }
    }

    return (
        <section className="mt-6 overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
            <header className="border-b border-[#E2E8F0] p-4">
                <h3 className="text-lg font-semibold text-[#352B28]">
                    Conversation
                </h3>
                <p className="text-sm text-[#746963]">
                    Messages between you and the other party
                </p>
            </header>

            <div
                className="flex max-h-[450px] min-h-[180px] flex-col gap-4 overflow-y-auto p-4"
                aria-live="polite"
            >
                {loading ? (
                    <p className="text-sm text-[#746963]">
                        Loading conversation...
                    </p>
                ) : messages.length === 0 ? (
                    <p className="my-auto text-center text-sm text-[#746963]">
                        No messages yet. Send a message to start the conversation.
                    </p>
                ) : (
                    messages.map((item) => {
                        const isMine = item.sender_id === currentUserId;

                        return (
                            <div
                                key={item.id}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                        isMine
                                            ? "bg-[#C96F52] text-white"
                                            : "bg-[#F6F1EA] text-[#352B28]"
                                    }`}
                                >
                                    <p className="mb-1 text-xs font-semibold opacity-80">
                                        {isMine ? "You" : item.sender_name || "Other party"}
                                    </p>

                                    <p className="whitespace-pre-wrap break-words">
                                        {item.message}
                                    </p>

                                    <time className="mt-2 block text-right text-xs opacity-75">
                                        {new Date(item.created_at).toLocaleString()}
                                    </time>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {error && (
                <p role="alert" className="px-4 pb-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 border-t border-[#E2E8F0] p-3"
            >
                <label htmlFor={`chat-message-${inquiryId}`} className="sr-only">
                    Your message
                </label>

                <textarea
                    id={`chat-message-${inquiryId}`}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type a message..."
                    rows={2}
                    maxLength={2000}
                    required
                    className="min-w-0 flex-1 resize-y rounded-lg border border-[#E2E8F0] p-3 text-[#352B28] outline-none focus:border-[#C96F52]"
                />

                <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="rounded-lg bg-[#C96F52] px-4 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {sending ? "Sending..." : "Send"}
                </button>
            </form>
        </section>
    );
}