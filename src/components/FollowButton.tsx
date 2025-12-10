import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface FollowButtonProps {
    targetUserId: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({ targetUserId, onFollowChange }: FollowButtonProps) {
    const { user } = useUser();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && targetUserId && user.id !== targetUserId) {
            checkFollowStatus();
        }
    }, [user, targetUserId]);

    async function checkFollowStatus() {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", user.id)
                .eq("following_id", targetUserId)
                .single();

            if (!error && data) {
                setIsFollowing(true);
            } else {
                setIsFollowing(false);
            }
        } catch (error) {
            setIsFollowing(false);
        }
    }

    async function toggleFollow() {
        if (!user || loading || user.id === targetUserId) return;

        setLoading(true);
        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("following_id", targetUserId);

                if (!error) {
                    setIsFollowing(false);
                    onFollowChange?.(false);
                }
            } else {
                const { error } = await supabase
                    .from("follows")
                    .insert({
                        follower_id: user.id,
                        following_id: targetUserId
                    });

                if (!error) {
                    setIsFollowing(true);
                    onFollowChange?.(true);
                }
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
        } finally {
            setLoading(false);
        }
    }

    // Don't show button if user is viewing their own profile
    if (!user || user.id === targetUserId) {
        return null;
    }

    return (
        <button
            onClick={toggleFollow}
            disabled={loading}
            className={`btn ${isFollowing ? 'secondary' : 'primary'}`}
            style={{
                minWidth: "100px",
                opacity: loading ? 0.6 : 1
            }}
        >
            {loading ? "..." : isFollowing ? "Following" : "Follow"}
        </button>
    );
}
