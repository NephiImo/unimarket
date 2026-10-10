import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getReceivedInquiries } from "@/app/lib/inquiries/queries";
import InquiriesPageContent from "@/components/InquiriesPageContent";

export default async function ReceivedInquiriesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const inquiries = await getReceivedInquiries(user.id);

    return <InquiriesPageContent inquiries={inquiries} />;
}
