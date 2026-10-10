import { cookies } from "next/headers";
import { getUserById } from "@/app/lib/auth/queries";
import { verifySessionToken } from "@/app/lib/auth/session";

export async function getCurrentUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
        return null;
    }

    const userId = await verifySessionToken(sessionToken);

    if (!userId) {
        return null;
    }

    const user = await getUserById(userId);

    return user;
}