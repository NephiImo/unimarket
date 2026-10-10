export const LISTING_LIMITS = {
    title: 150,
    description: 5000,
    location: 150,
    imageUrl: 2048,
    maxPrice: 99999999.99,
} as const;

export const LISTING_STATUSES = ["active", "sold"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export type ListingInput = {
    categoryId: number;
    title: string;
    description: string;
    price: number;
    imageUrl: string | null;
    location: string;
    status: ListingStatus;
};

export type ListingFieldErrors = Partial<
    Record<keyof ListingInput | "form", string>
>;

type ValidationResult<T> = {
    data: T | null;
    errors: ListingFieldErrors;
};

export function isListingId(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function validateListingInput(
    input: unknown,
    partial?: false,
): ValidationResult<ListingInput>;
export function validateListingInput(
    input: unknown,
    partial: true,
): ValidationResult<Partial<ListingInput>>;
export function validateListingInput(
    input: unknown,
    partial = false,
): ValidationResult<Partial<ListingInput>> {
    const errors: ListingFieldErrors = {};

    if (typeof input !== "object" || input === null || Array.isArray(input)) {
        return { data: null, errors: { form: "Provide valid listing details." } };
    }

    const body = input as Record<string, unknown>;
    const data: Partial<ListingInput> = {};
    const has = (field: keyof ListingInput) =>
        Object.prototype.hasOwnProperty.call(body, field);

    for (const field of ["title", "description", "location"] as const) {
        if (partial && !has(field)) continue;

        const value = body[field];
        const label = field[0].toUpperCase() + field.slice(1);
        if (typeof value !== "string" || !value.trim()) {
            errors[field] = `${label} is required.`;
        } else if (value.trim().length > LISTING_LIMITS[field]) {
            errors[field] = `${label} must be ${LISTING_LIMITS[field]} characters or fewer.`;
        } else {
            data[field] = value.trim();
        }
    }

    if (!partial || has("categoryId")) {
        const categoryId = body.categoryId;
        if (
            typeof categoryId !== "number" ||
            !Number.isInteger(categoryId) ||
            categoryId <= 0 ||
            categoryId > 2147483647
        ) {
            errors.categoryId = "Select a valid category.";
        } else {
            data.categoryId = categoryId;
        }
    }

    if (!partial || has("price")) {
        const price = body.price;
        if (
            typeof price !== "number" ||
            !Number.isFinite(price) ||
            price < 0 ||
            price > LISTING_LIMITS.maxPrice
        ) {
            errors.price = `Enter a price between 0 and ${LISTING_LIMITS.maxPrice}.`;
        } else if (Math.round(price * 100) / 100 !== price) {
            errors.price = "Price must have no more than two decimal places.";
        } else {
            data.price = price;
        }
    }

    if (!partial || has("imageUrl")) {
        const value = body.imageUrl;
        if (value === null || value === undefined || value === "") {
            data.imageUrl = null;
        } else if (typeof value !== "string") {
            errors.imageUrl = "Enter a valid HTTP or HTTPS image URL.";
        } else {
            const imageUrl = value.trim();
            if (!imageUrl) {
                data.imageUrl = null;
            } else if (imageUrl.length > LISTING_LIMITS.imageUrl) {
                errors.imageUrl = `Image URL must be ${LISTING_LIMITS.imageUrl} characters or fewer.`;
            } else {
                try {
                    const url = new URL(imageUrl);
                    if (
                        (url.protocol !== "http:" && url.protocol !== "https:") ||
                        !url.hostname ||
                        url.username ||
                        url.password
                    ) {
                        errors.imageUrl = "Enter a valid HTTP or HTTPS image URL.";
                    } else {
                        data.imageUrl = imageUrl;
                    }
                } catch {
                    errors.imageUrl = "Enter a valid HTTP or HTTPS image URL.";
                }
            }
        }
    }

    if (!partial || has("status")) {
        const status = has("status") ? body.status : "active";
        if (!LISTING_STATUSES.includes(status as ListingStatus)) {
            errors.status = "Select a valid availability status.";
        } else {
            data.status = status as ListingStatus;
        }
    }

    if (partial && Object.keys(data).length === 0 && Object.keys(errors).length === 0) {
        errors.form = "Provide at least one listing field to update.";
    }

    return { data: Object.keys(errors).length > 0 ? null : data, errors };
}
