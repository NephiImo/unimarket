export const INQUIRY_MESSAGE_LIMIT = 2000;

export function isInquiryId(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function validateInquiryText(
    input: unknown,
    field: "message" | "response" = "message",
): { value: string | null; error: string | null } {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { value: null, error: "Please provide valid message information." };
    }

    const raw = (input as Record<string, unknown>)[field];
    if (typeof raw !== "string") {
        return {
            value: null,
            error: field === "response" ? "A response message is required." : "A message is required.",
        };
    }

    const value = raw.trim();
    if (!value || value.length > INQUIRY_MESSAGE_LIMIT) {
        const label = field === "response" ? "Response" : "Message";
        return {
            value: null,
            error: `${label} must be between 1 and ${INQUIRY_MESSAGE_LIMIT} characters.`,
        };
    }

    return { value, error: null };
}
