import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getSentInquiries } from "@/app/lib/inquiries/queries";
import InquiryChat from "@/components/InquiryChat";

export const metadata: Metadata = {
    title: "My Inquiries | UniMarket",
    description: "View your sent inquiries and chat with sellers on UniMarket.",
};

export default async function SentInquiriesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const inquiries = await getSentInquiries(user.id);

    return (
        <main className="min-h-screen bg-[#F6F1EA] px-4 py-10">
            <div className="mx-auto max-w-3xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-[#352B28]">
                        My inquiries
                    </h1>
                    <p className="mt-2 text-[#514741]">
                        View your messages and chat with sellers about their listings.
                    </p>
                </header>

                {inquiries.length === 0 ? (
                    <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 text-center">
                        <h2 className="font-semibold text-[#352B28]">
                            No inquiries yet
                        </h2>
                        <p className="mt-1 text-sm text-[#514741]">
                            Inquiries you send about listings will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {inquiries.map((inquiry) => (
                            <article
                                key={inquiry.id}
                                className="rounded-lg border border-[#E2E8F0] bg-white p-5"
                            >
                                <h2 className="text-lg font-semibold text-[#352B28]">
                                    {inquiry.listing_title}
                                </h2>

                                <p className="mt-1 text-sm text-[#514741]">
                                    Seller: {inquiry.seller_name}
                                </p>

                                <div className="mt-4">
                                    <h3 className="font-medium text-[#352B28]">
                                        Your original inquiry
                                    </h3>
                                    <p className="mt-1 whitespace-pre-line text-[#514741]">
                                        {inquiry.message}
                                    </p>
                                </div>

                                <div className="mt-4 rounded-lg bg-[#F6F1EA] p-4">
                                    <h3 className="font-semibold text-[#352B28]">
                                        Seller&apos;s initial response
                                    </h3>

                                    {inquiry.seller_response ? (
                                        <>
                                            <p className="mt-2 whitespace-pre-line text-[#352B28]">
                                                {inquiry.seller_response}
                                            </p>

                                            {inquiry.responded_at && (
                                                <p className="mt-2 text-xs text-[#514741]">
                                                    Replied on{" "}
                                                    {new Date(
                                                        inquiry.responded_at,
                                                    ).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="mt-2 text-sm text-[#514741]">
                                            Waiting for the seller to respond.
                                        </p>
                                    )}
                                </div>

                                <InquiryChat
                                    inquiryId={inquiry.id}
                                    currentUserId={user.id}
                                />
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
