
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
    name: string;
    email: string;
};

type Profile = {
    name: string;
    email: string;
    contact_preference: "email" | "in_app";
};

export default function ProfileForm({ name, email }: ProfileFormProps) {
    const router = useRouter();

    const [displayName, setDisplayName] = useState(name);
    const [contactPreference, setContactPreference] =
        useState<"email" | "in_app">("email");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            try {
                const response = await fetch("/api/profile");
                const data = await response.json();

                if (!response.ok) {
                    setMessage(data.error || "Unable to load your profile.");
                    return;
                }

                const profile: Profile = data.profile;
                setDisplayName(profile.name);
                setContactPreference(profile.contact_preference);
            } catch {
                setMessage("Unable to load your saved profile.");
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        const trimmedName = displayName.trim();

        if (!trimmedName || trimmedName.length > 100) {
            setMessage("Display name must be between 1 and 100 characters.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmedName,
                    contactPreference,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.error || "Unable to update your profile.");
                return;
            }

            setDisplayName(data.profile.name);
            setContactPreference(data.profile.contact_preference);
            setMessage("Profile updated successfully.");

            router.refresh();
        } catch {
            setMessage("Something went wrong. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Profile Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="displayName"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Display Name
                    </label>
                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        maxLength={100}
                        required
                        disabled={loading || saving}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-[#C96F52] focus:ring-2 focus:ring-[#ebc8ba] disabled:opacity-60"
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        readOnly
                        className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2"
                    />
                </div>

                <div>
                    <label
                        htmlFor="contactPreference"
                        className="mb-1 block text-sm font-medium text-gray-700"
                    >
                        Contact Preference
                    </label>
                    <select
                        id="contactPreference"
                        value={contactPreference}
                        onChange={(event) =>
                            setContactPreference(
                                event.target.value as "email" | "in_app"
                            )
                        }
                        disabled={loading || saving}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:opacity-60"
                    >
                        <option value="email">Email</option>
                        <option value="in_app">In-app messages</option>
                    </select>
                </div>

                {message && (
                    <p role="status" className="text-sm text-gray-700">
                        {message}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || saving}
                    className="rounded-md bg-[#C96F52] px-5 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                    {loading
                        ? "Loading Profile..."
                        : saving
                          ? "Saving..."
                          : "Save Changes"}
                </button>
            </form>
        </section>
    );
}
