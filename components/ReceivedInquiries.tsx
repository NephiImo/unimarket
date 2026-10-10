import type { ReceivedInquiry } from "@/app/lib/inquiries/queries";

interface ReceivedInquiriesProps {
  inquiries: ReceivedInquiry[];
}

export default function ReceivedInquiries({
  inquiries,
}: ReceivedInquiriesProps) {
  if (inquiries.length === 0) {
    return (
      <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-center">
        <h2 className="font-semibold text-[#352B28]">No inquiries yet</h2>

        <p className="mt-1 text-sm text-[#64748B]">
          Messages from interested buyers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => {
        const sentAt = new Date(inquiry.created_at).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        );

        return (
          <article
            key={inquiry.id}
            className="rounded-lg border border-[#E2E8F0] bg-white p-5"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold text-[#352B28]">
                  {inquiry.listing_title}
                </h2>

                <p className="text-sm text-[#64748B]">
                  From {inquiry.sender_name}
                </p>
              </div>

              <time className="text-sm text-[#64748B]">
                {sentAt}
              </time>
            </div>

            <p className="mt-4 whitespace-pre-line text-[#352B28]">
              {inquiry.message}
            </p>
          </article>
        );
      })}
    </div>
  );
}