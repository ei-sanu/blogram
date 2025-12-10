import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface LikeButtonProps {
    postId: string;
}

export default function LikeButton({ postId }: LikeButtonProps) {
    const { user } = useUser();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (postId) {
            getLikeCount();
            if (user) {
                checkIfLiked();
            }
        }
    }, [user, postId]);

    async function checkIfLiked() {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("likes")
                .select("id")
                .eq("post_id", postId)
                .eq("user_id", user.id)
                .single();

            if (!error && data) {
                setIsLiked(true);
            } else {
                setIsLiked(false);
            }
        } catch (error) {
            console.error("Error checking like status:", error);
            setIsLiked(false);
        }
    }

    async function getLikeCount() {
        try {
            const { count, error } = await supabase
                .from("likes")
                .select("*", { count: "exact", head: true })
                .eq("post_id", postId);

            if (!error) {
                setLikeCount(count || 0);
            }
        } catch (error) {
            console.error("Error getting like count:", error);
        }
    }

    async function toggleLike() {
        if (!user || loading) return;

        setLoading(true);

        try {
            if (isLiked) {
                const { error } = await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", user.id);

                if (!error) {
                    setIsLiked(false);
                    setLikeCount(prev => Math.max(0, prev - 1));
                }
            } else {
                const { error } = await supabase
                    .from("likes")
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    });

                if (!error) {
                    setIsLiked(true);
                    setLikeCount(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                className={`like-button ${isLiked ? 'liked' : ''}`}
                onClick={toggleLike}
                disabled={!user || loading}
            >
                {isLiked ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ed4956">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                )}
            </button>
            {likeCount > 0 && (
                <div className="like-count">
                    {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                </div>
            )}
        </>
    );
}
