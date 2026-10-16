import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getReceivedInquiries } from "@/app/lib/inquiries/queries";
import InquiriesPageContent from "@/components/InquiriesPageContent";

export const metadata: Metadata = {
    title: "Received Inquiries | UniMarket",
    description: "Read buyer inquiries and continue conversations on UniMarket.",
};

export default async function ReceivedInquiriesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const inquiries = await getReceivedInquiries(user.id);

    return (
        <InquiriesPageContent
            inquiries={inquiries}
            currentUserId={user.id}
        />
    );
}
