import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

interface UserPreviewProps {
    userId: string;
    onClose: () => void;
    anchorElement?: HTMLElement;
}

interface UserProfile {
    id: string;
    display_name: string;
    profile_image_url?: string;
    bio?: string;
}

interface FollowCounts {
    followers: number;
    following: number;
    posts: number;
}

export default function UserPreview({ userId, onClose, anchorElement }: UserPreviewProps) {
    const { user } = useUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0, posts: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [userId]);

    async function fetchUserData() {
        try {
            setLoading(true);

            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("id, display_name, profile_image_url, bio")
                .eq("id", userId)
                .single();

            if (profileError) {
                console.error("Error fetching profile:", profileError);
                return;
            }

            setProfile(profileData);

            // Fetch counts
            const [followersResult, followingResult, postsResult] = await Promise.all([
                supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
                supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
                supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", userId)
            ]);

            setCounts({
                followers: followersResult.count || 0,
                following: followingResult.count || 0,
                posts: postsResult.count || 0
            });
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    }

    function getPosition() {
        if (!anchorElement) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

        const rect = anchorElement.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        if (spaceBelow > 200) {
            return {
                top: rect.bottom + 8,
                left: Math.max(8, Math.min(rect.left, window.innerWidth - 328))
            };
        } else if (spaceAbove > 200) {
            return {
                bottom: window.innerHeight - rect.top + 8,
                left: Math.max(8, Math.min(rect.left, window.innerWidth - 328))
            };
        } else {
            return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
        }
    }

    if (loading) {
        return (
            <div className="modal-overlay">
                <div
                    className="user-preview"
                    style={{
                        position: "fixed",
                        ...getPosition(),
                        background: "white",
                        borderRadius: "12px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                        padding: "24px",
                        minWidth: "320px",
                        zIndex: 1001
                    }}
                >
                    <div className="loading">Loading...</div>
                </div>
            </div>
        );
    }

    if (!profile) {
        onClose();
        return null;
    }

    const isOwnProfile = user?.id === userId;

    return (
        <>
            <div
                className="modal-overlay"
                style={{ background: "transparent" }}
                onClick={onClose}
            />
            <div
                className="user-preview"
                style={{
                    position: "fixed",
                    ...getPosition(),
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                    padding: "24px",
                    minWidth: "320px",
                    zIndex: 1001
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <Avatar
                        src={profile.profile_image_url}
                        alt={`${profile.display_name}'s profile picture`}
                        size="large"
                        fallbackText={profile.display_name || "U"}
                        style={{ margin: "0 auto 16px" }}
                    />

                    <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: "600" }}>
                        {profile.display_name || "Anonymous"}
                    </h3>

                    {profile.bio && (
                        <p style={{
                            margin: "0 0 16px",
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            lineHeight: "1.3"
                        }}>
                            {profile.bio}
                        </p>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "20px" }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: "600", fontSize: "16px" }}>{counts.posts}</div>
                            <div style={{ fontSize: "12px", color: "#8e8e8e" }}>posts</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: "600", fontSize: "16px" }}>{counts.followers}</div>
                            <div style={{ fontSize: "12px", color: "#8e8e8e" }}>followers</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontWeight: "600", fontSize: "16px" }}>{counts.following}</div>
                            <div style={{ fontSize: "12px", color: "#8e8e8e" }}>following</div>
                        </div>
                    </div>

                    {!isOwnProfile && (
                        <FollowButton
                            targetUserId={userId}
                            onFollowChange={(isFollowing) => {
                                setCounts(prev => ({
                                    ...prev,
                                    followers: prev.followers + (isFollowing ? 1 : -1)
                                }));
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
