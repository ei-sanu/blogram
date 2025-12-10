import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
//topramen
interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: "small" | "medium" | "large" | "xlarge";
    fallbackText?: string;
    className?: string;
    style?: React.CSSProperties;
    userId?: string;
    showFollowOverlay?: boolean;
    onFollowChange?: (isFollowing: boolean) => void;
}

const sizeMap = {
    small: { width: "24px", height: "24px", fontSize: "10px", overlay: "8px" },
    medium: { width: "32px", height: "32px", fontSize: "12px", overlay: "12px" },
    large: { width: "50px", height: "50px", fontSize: "18px", overlay: "16px" },
    xlarge: { width: "150px", height: "150px", fontSize: "48px", overlay: "40px" },
};

export default function Avatar({
    src,
    alt,
    size = "medium",
    fallbackText = "?",
    className = "",
    style = {},
    userId,
    showFollowOverlay = false,
    onFollowChange
}: AvatarProps) {
    const { user } = useUser();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const sizeStyle = sizeMap[size];

    useEffect(() => {
        if (showFollowOverlay && user && userId && user.id !== userId) {
            checkFollowStatus();
        }
    }, [showFollowOverlay, user, userId]);

    async function checkFollowStatus() {
        if (!user || !userId) return;

        try {
            const { data, error } = await supabase
                .from("follows")
                .select("id")
                .eq("follower_id", user.id)
                .eq("following_id", userId)
                .single();

            setIsFollowing(!error && !!data);
        } catch (error) {
            setIsFollowing(false);
        }
    }

    async function toggleFollow(e: React.MouseEvent) {
        e.stopPropagation();
        if (!user || !userId || loading || user.id === userId) return;

        setLoading(true);
        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from("follows")
                    .delete()
                    .eq("follower_id", user.id)
                    .eq("following_id", userId);

                if (!error) {
                    setIsFollowing(false);
                    onFollowChange?.(false);
                }
            } else {
                const { error } = await supabase
                    .from("follows")
                    .insert({
                        follower_id: user.id,
                        following_id: userId
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

    const avatarStyle: React.CSSProperties = {
        ...sizeStyle,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: src ? "transparent" : "linear-gradient(45deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)",
        color: "white",
        fontWeight: "600",
        overflow: "visible",
        flexShrink: 0,
        position: "relative",
        ...style,
    };

    const overlayStyle: React.CSSProperties = {
        position: "absolute",
        bottom: "0",
        right: "0",
        width: sizeStyle.overlay,
        height: sizeStyle.overlay,
        borderRadius: "50%",
        background: isFollowing ? "#22c55e" : "#0095f6",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: parseInt(sizeStyle.overlay) * 0.5 + "px",
        cursor: "pointer",
        border: "2px solid white",
        zIndex: 1
    };

    const showOverlay = showFollowOverlay && user && userId && user.id !== userId;

    return (
        <div style={avatarStyle} className={`avatar ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={alt || "Profile picture"}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover"
                    }}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                    }}
                />
            ) : (
                fallbackText.charAt(0).toUpperCase()
            )}

            {showOverlay && (
                <div
                    style={overlayStyle}
                    onClick={toggleFollow}
                    title={isFollowing ? "Following" : "Follow"}
                >
                    {loading ? (
                        "..."
                    ) : isFollowing ? (
                        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                        </svg>
                    ) : (
                        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    )}
                </div>
            )}
        </div>
    );
}
