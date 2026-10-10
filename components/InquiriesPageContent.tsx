import ReceivedInquiries from "@/components/ReceivedInquiries";
import type { ReceivedInquiry } from "@/app/lib/inquiries/queries";

interface InquiriesPageContentProps {
  inquiries: ReceivedInquiry[];
}

export default function InquiriesPageContent({
  inquiries,
}: InquiriesPageContentProps) {
  return (
    <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#352B28]">
            Received inquiries
          </h1>

          <p className="mt-2 text-[#64748B]">
            Messages from students interested in your listings.
          </p>
        </header>

        <ReceivedInquiries inquiries={inquiries} />
      </div>
    </main>
  );
}