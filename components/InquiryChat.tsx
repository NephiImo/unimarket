'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  INQUIRY_MESSAGE_LIMIT,
  validateInquiryText,
} from '@/app/lib/inquiries/validation';

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

type ChatSession = {
  active: boolean;
  read: AbortController | null;
  write: AbortController | null;
  timer: ReturnType<typeof setTimeout> | null;
  stopReading: () => void;
  schedule: () => void;
  dispose: () => void;
};

export default function InquiryChat({
  inquiryId,
  currentUserId,
}: InquiryChatProps) {
  return (
    <InquiryConversation
      key={`${inquiryId}:${currentUserId}`}
      inquiryId={inquiryId}
      currentUserId={currentUserId}
    />
  );
}

function InquiryConversation({ inquiryId, currentUserId }: InquiryChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const sessionRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const isVisible = () => document.visibilityState === 'visible';
    const isCurrent = () => session.active && sessionRef.current === session;
    const clearTimer = () => {
      if (session.timer !== null) clearTimeout(session.timer);
      session.timer = null;
    };
    const session: ChatSession = {
      active: true,
      read: null,
      write: null,
      timer: null,
      stopReading() {
        clearTimer();
        session.read?.abort();
        session.read = null;
      },
      schedule() {
        clearTimer();
        if (isCurrent() && isVisible() && !session.read && !session.write) {
          session.timer = setTimeout(() => void loadMessages(), 12000);
        }
      },
      dispose() {
        session.active = false;
        session.stopReading();
        session.write?.abort();
        session.write = null;
        if (sessionRef.current === session) sessionRef.current = null;
      },
    };
    sessionRef.current = session;

    async function loadMessages() {
      if (!isCurrent() || !isVisible() || session.read || session.write) return;
      clearTimer();
      const controller = new AbortController();
      session.read = controller;

      try {
        const result = await fetch(
          `/api/inquiries/${encodeURIComponent(inquiryId)}/messages`,
          { cache: 'no-store', signal: controller.signal }
        );
        const data: unknown = await result.json();
        if (
          !isCurrent() ||
          session.read !== controller ||
          controller.signal.aborted
        )
          return;

        if (!result.ok || !Array.isArray(data)) {
          setError(
            result.status === 401
              ? 'Your session has expired. Please log in again.'
              : 'Could not load messages. Please try again.'
          );
          return;
        }

        setMessages(data);
        setError('');
      } catch {
        if (
          isCurrent() &&
          session.read === controller &&
          !controller.signal.aborted
        ) {
          setError('Could not load messages. Please try again.');
        }
      } finally {
        if (session.read === controller) {
          session.read = null;
          if (isCurrent()) {
            setLoading(false);
            session.schedule();
          }
        }
      }
    }

    const handleVisibilityChange = () => {
      if (!isVisible()) {
        session.stopReading();
        return;
      }
      void loadMessages();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    void loadMessages();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      session.dispose();
    };
  }, [isOpen, inquiryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const session = sessionRef.current;
    if (!session?.active || session.write) return;
    const { value: text, error: validationError } = validateInquiryText({
      message,
    });
    if (!text) {
      setError(validationError ?? 'Enter a message before sending.');
      return;
    }

    session.stopReading();
    const controller = new AbortController();
    session.write = controller;
    setSending(true);
    setError('');

    try {
      const result = await fetch(
        `/api/inquiries/${encodeURIComponent(inquiryId)}/messages`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: text }),
        }
      );

      const data = await result.json();
      if (
        !session.active ||
        sessionRef.current !== session ||
        session.write !== controller ||
        controller.signal.aborted
      )
        return;

      if (!result.ok) {
        setError(
          result.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'Could not send message. Please try again.'
        );
        return;
      }

      setMessages((previous) =>
        previous.some((item) => item.id === data.id)
          ? previous
          : [...previous, data]
      );
      setMessage('');
      setLoading(false);
    } catch {
      if (
        session.active &&
        sessionRef.current === session &&
        !controller.signal.aborted
      ) {
        setError('Message could not be sent. Please try again.');
      }
    } finally {
      if (session.write === controller) {
        session.write = null;
        if (session.active && sessionRef.current === session) {
          setLoading(false);
          setSending(false);
          session.schedule();
        }
      }
    }
  }

  return (
    <details
      open={isOpen}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        if (nextOpen === isOpen) return;
        if (!nextOpen) {
          sessionRef.current?.dispose();
          setSending(false);
        }
        setLoading(true);
        setIsOpen(nextOpen);
      }}
      className="mt-6 rounded-xl border border-[#E2E8F0] bg-white"
    >
      <summary className="cursor-pointer rounded-xl p-4 text-lg font-semibold text-[#352B28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#783322]">
        Conversation
      </summary>
      {isOpen && (
        <>
          <p className="border-t border-[#E2E8F0] px-4 pt-4 text-sm text-[#514741]">
            Messages between you and the other party
          </p>

          <div
            className="flex max-h-[450px] min-h-[180px] flex-col gap-4 overflow-y-auto p-4"
            role="log"
            aria-label="Conversation messages"
            aria-live="polite"
          >
            {loading ? (
              <p className="text-sm text-[#514741]">Loading conversation...</p>
            ) : messages.length === 0 ? (
              <p className="my-auto text-center text-sm text-[#514741]">
                No messages yet. Send a message to start the conversation.
              </p>
            ) : (
              messages.map((item) => {
                const isMine = item.sender_id === currentUserId;

                return (
                  <div
                    key={item.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        isMine
                          ? 'bg-[#783322] text-white'
                          : 'bg-[#F6F1EA] text-[#352B28]'
                      }`}
                    >
                      <p className="mb-1 text-xs font-semibold">
                        {isMine ? 'You' : item.sender_name || 'Other party'}
                      </p>

                      <p className="whitespace-pre-wrap break-words">
                        {item.message}
                      </p>

                      <time className="mt-2 block text-right text-xs">
                        {new Date(item.created_at).toLocaleString()}
                      </time>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <p role="alert" className="px-4 pb-2 text-sm text-red-800">
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
              maxLength={INQUIRY_MESSAGE_LIMIT}
              disabled={sending}
              required
              className="min-w-0 flex-1 resize-y rounded-lg border border-[#E2E8F0] p-3 text-[#352B28] outline-none placeholder:text-[#514741] focus:border-[#783322] focus:ring-2 focus:ring-[#783322]"
            />

            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="rounded-lg bg-[#783322] px-4 py-3 font-semibold text-white hover:bg-[#5C2618] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#783322] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </>
      )}
    </details>
  );
}
