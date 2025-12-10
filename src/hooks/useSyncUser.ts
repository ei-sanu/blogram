import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export function useSyncUser() {
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (isLoaded && user) {
            syncUserToSupabase();
        }
    }, [isLoaded, user]);

    async function syncUserToSupabase() {
        if (!user) return;

        try {
            // Check if user already exists
            const { data: existingUser, error: selectError } = await supabase
                .from("profiles")
                .select("id, profile_image_url")
                .eq("id", user.id)
                .single();

            const profileImageUrl = user.imageUrl || user.profileImageUrl || null;
            const displayName = user.fullName || user.firstName || "Anonymous";
            const email = user.primaryEmailAddress?.emailAddress;

            if (selectError || !existingUser) {
                // Create new user profile
                const { error: insertError } = await supabase
                    .from("profiles")
                    .insert({
                        id: user.id,
                        display_name: displayName,
                        email: email,
                        profile_image_url: profileImageUrl,
                    });

                if (insertError) {
                    console.error("Error creating user profile:", insertError);
                } else {
                    console.log("User profile created successfully");
                }
            } else {
                // Update existing user if profile image has changed
                if (existingUser.profile_image_url !== profileImageUrl) {
                    const { error: updateError } = await supabase
                        .from("profiles")
                        .update({
                            display_name: displayName,
                            email: email,
                            profile_image_url: profileImageUrl,
                        })
                        .eq("id", user.id);

                    if (updateError) {
                        console.error("Error updating user profile:", updateError);
                    } else {
                        console.log("User profile updated successfully");
                    }
                }
            }
        } catch (error) {
            console.error("Error syncing user:", error);
        }
    }
}
