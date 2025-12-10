import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import FollowButton from "../components/FollowButton";
import FollowList from "../components/FollowList";
import PostCard from "../components/PostCard";
import { supabase } from "../lib/supabase";

interface Post {
    id: string;
    title: string;
    content: string;
    cover_url?: string;
    created_at: string;
    author_id: string;
    profiles?: {
        display_name?: string;
        profile_image_url?: string;
    };
}

interface UserProfile {
    id: string;
    display_name: string;
    email: string;
    created_at: string;
    profile_image_url?: string;
    bio?: string;
}

interface FollowCounts {
    followers: number;
    following: number;
    friends: number;
}

export default function UserProfile() {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useUser();
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0, friends: 0 });
    const [loading, setLoading] = useState(true);
    const [showFollowList, setShowFollowList] = useState<"followers" | "following" | "friends" | null>(null);

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
            fetchUserPosts();
            fetchFollowCounts();
        }
    }, [userId]);

    async function fetchUserProfile() {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
            } else {
                setUserProfile(data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }

    async function fetchFollowCounts() {
        if (!userId) return;

        try {
            // Get followers count
            const { count: followersCount } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("following_id", userId);

            // Get following count
            const { count: followingCount } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("follower_id", userId);

            // Get friends count (mutual follows)
            const { data: following } = await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", userId);

            let friendsCount = 0;
            if (following && following.length > 0) {
                const followingIds = following.map(f => f.following_id);
                const { count } = await supabase
                    .from("follows")
                    .select("*", { count: "exact", head: true })
                    .eq("following_id", userId)
                    .in("follower_id", followingIds);
                friendsCount = count || 0;
            }

            setFollowCounts({
                followers: followersCount || 0,
                following: followingCount || 0,
                friends: friendsCount
            });
        } catch (error) {
            console.error("Error fetching follow counts:", error);
        }
    }

    async function fetchUserPosts() {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from("posts")
                .select(`
                    *,
                    profiles (
                        display_name,
                        profile_image_url
                    )
                `)
                .eq("author_id", userId)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching user posts:", error);
            } else {
                setUserPosts(data || []);
            }
        } catch (error) {
            console.error("Error fetching user posts:", error);
        } finally {
            setLoading(false);
        }
    }

    function handleFollowChange() {
        fetchFollowCounts(); // Refresh counts when follow status changes
    }

    if (loading) {
        return (
            <div className="center-page">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="center-page card">
                <h2>Profile Not Found</h2>
                <p style={{ color: "#666" }}>The user you're looking for doesn't exist.</p>
            </div>
        );
    }

    const isOwnProfile = currentUser?.id === userId;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Profile Header */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div className="profile-header">
                    <Avatar
                        src={userProfile.profile_image_url}
                        alt={`${userProfile.display_name}'s profile picture`}
                        size="xlarge"
                        fallbackText={userProfile.display_name || "U"}
                        className="profile-avatar"
                    />

                    <div className="profile-info">
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                            <h2 className="profile-username" style={{ margin: 0 }}>
                                {userProfile.display_name || "Anonymous"}
                            </h2>
                            {!isOwnProfile && currentUser && (
                                <FollowButton
                                    targetUserId={userId!}
                                    onFollowChange={handleFollowChange}
                                />
                            )}
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-number">{userPosts.length}</span>
                                <span className="stat-label">posts</span>
                            </div>
                            <button
                                className="stat-item"
                                onClick={() => setShowFollowList("followers")}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                            >
                                <span className="stat-number">{followCounts.followers}</span>
                                <span className="stat-label">followers</span>
                            </button>
                            <button
                                className="stat-item"
                                onClick={() => setShowFollowList("following")}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                            >
                                <span className="stat-number">{followCounts.following}</span>
                                <span className="stat-label">following</span>
                            </button>
                            <button
                                className="stat-item"
                                onClick={() => setShowFollowList("friends")}
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                            >
                                <span className="stat-number">{followCounts.friends}</span>
                                <span className="stat-label">friends</span>
                            </button>
                        </div>

                        <p className="profile-bio">
                            {userProfile.email}
                        </p>
                        {userProfile.bio && (
                            <p className="profile-bio" style={{
                                margin: "16px 0",
                                fontSize: "14px",
                                lineHeight: "1.4",
                                color: "var(--text-color)"
                            }}>
                                {userProfile.bio}
                            </p>
                        )}
                        <p style={{ color: "#8e8e8e", fontSize: "14px", margin: 0 }}>
                            Joined {new Date(userProfile.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* User Posts */}
            <div>
                <h3 style={{ marginBottom: "1rem" }}>
                    {isOwnProfile ? "Your Posts" : `${userProfile.display_name}'s Posts`}
                </h3>

                {userPosts.length === 0 ? (
                    <div className="card" style={{ textAlign: "center" }}>
                        <h4>No posts yet</h4>
                        <p style={{ color: "#666" }}>
                            {isOwnProfile ? "You haven't created any posts yet." : "This user hasn't posted anything yet."}
                        </p>
                    </div>
                ) : (
                    userPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                        />
                    ))
                )}
            </div>

            {/* Follow Lists Modal */}
            {showFollowList && (
                <FollowList
                    userId={userId!}
                    type={showFollowList}
                    onClose={() => setShowFollowList(null)}
                />
            )}
        </div>
    );
}
