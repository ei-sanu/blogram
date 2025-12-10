import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import EditPostModal from "../components/EditPostModal";
import FollowList from "../components/FollowList";
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

export default function Profile() {
    const { user } = useUser();
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0, friends: 0 });
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [newDisplayName, setNewDisplayName] = useState("");
    const [newBio, setNewBio] = useState("");
    const [showFollowList, setShowFollowList] = useState<"followers" | "following" | "friends" | null>(null);

    useEffect(() => {
        if (user) {
            fetchUserProfile();
            fetchUserPosts();
            fetchFollowCounts();
        }
    }, [user]);

    async function fetchUserProfile() {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("Error fetching profile:", error);
            } else {
                setUserProfile(data);
                setNewDisplayName(data.display_name || "");
                setNewBio(data.bio || "");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    }

    async function fetchFollowCounts() {
        if (!user) return;

        try {
            const { count: followersCount } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("following_id", user.id);

            const { count: followingCount } = await supabase
                .from("follows")
                .select("*", { count: "exact", head: true })
                .eq("follower_id", user.id);

            const { data: following } = await supabase
                .from("follows")
                .select("following_id")
                .eq("follower_id", user.id);

            let friendsCount = 0;
            if (following && following.length > 0) {
                const followingIds = following.map(f => f.following_id);
                const { count } = await supabase
                    .from("follows")
                    .select("*", { count: "exact", head: true })
                    .eq("following_id", user.id)
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
        if (!user) return;

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
                .eq("author_id", user.id)
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

    async function updateProfile() {
        if (!user || !userProfile) return;

        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: newDisplayName.trim(),
                    bio: newBio.trim()
                })
                .eq("id", user.id);

            if (error) {
                console.error("Error updating profile:", error);
            } else {
                setUserProfile({
                    ...userProfile,
                    display_name: newDisplayName.trim(),
                    bio: newBio.trim()
                });
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    }

    async function deletePost(postId: string) {
        if (!user || !confirm("Are you sure you want to delete this post?")) return;

        try {
            const { error } = await supabase
                .from("posts")
                .delete()
                .eq("id", postId)
                .eq("author_id", user.id);

            if (error) {
                console.error("Error deleting post:", error);
            } else {
                setUserPosts(userPosts.filter(post => post.id !== postId));
            }
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    }

    function handleEditPost(post: Post) {
        setEditingPost(post);
    }

    function onPostUpdated(updatedPost: Post) {
        setUserPosts(userPosts.map(post =>
            post.id === updatedPost.id ? updatedPost : post
        ));
        setEditingPost(null);
    }

    if (loading) {
        return (
            <div className="center-page">
                <div className="loading">Loading profile...</div>
            </div>
        );
    }

    if (!user || !userProfile) {
        return (
            <div className="center-page card">
                <h2>Profile Not Found</h2>
                <p style={{ color: "var(--text-secondary)" }}>Unable to load your profile.</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Profile Header */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div className="profile-header">
                    <Avatar
                        src={userProfile.profile_image_url || user.imageUrl}
                        alt={`${userProfile.display_name}'s profile picture`}
                        size="xlarge"
                        fallbackText={userProfile.display_name || "U"}
                        className="profile-avatar"
                    />

                    <div className="profile-info">
                        {isEditing ? (
                            <div className="edit-profile-form">
                                <div className="form-field">
                                    <label className="field-label">Display Name</label>
                                    <div className="field-container">
                                        <input
                                            type="text"
                                            value={newDisplayName}
                                            onChange={(e) => setNewDisplayName(e.target.value)}
                                            className="form-input"
                                            placeholder="Enter your display name"
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label className="field-label">Bio</label>
                                    <div className="field-container">
                                        <textarea
                                            value={newBio}
                                            onChange={(e) => setNewBio(e.target.value)}
                                            className="form-input bio-input"
                                            placeholder="Tell us about yourself..."
                                            maxLength={150}
                                            rows={4}
                                        />
                                        <p className="field-help">
                                            {newBio.length}/150 characters
                                        </p>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setNewDisplayName(userProfile.display_name || "");
                                            setNewBio(userProfile.bio || "");
                                        }}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={updateProfile}
                                        className="btn btn-primary"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                                    <h2 className="profile-username" style={{ margin: 0 }}>
                                        {userProfile.display_name || "Anonymous"}
                                    </h2>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn secondary"
                                    >
                                        Edit Profile
                                    </button>
                                </div>

                                <div className="profile-stats">
                                    <div className="stat-item">
                                        <span className="stat-number">{userPosts.length}</span>
                                        <span className="stat-label">posts</span>
                                    </div>
                                    <button
                                        className="stat-item"
                                        onClick={() => setShowFollowList("followers")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "0",
                                            textAlign: "center"
                                        }}
                                    >
                                        <span className="stat-number">{followCounts.followers}</span>
                                        <span className="stat-label">followers</span>
                                    </button>
                                    <button
                                        className="stat-item"
                                        onClick={() => setShowFollowList("following")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "0",
                                            textAlign: "center"
                                        }}
                                    >
                                        <span className="stat-number">{followCounts.following}</span>
                                        <span className="stat-label">following</span>
                                    </button>
                                    <button
                                        className="stat-item"
                                        onClick={() => setShowFollowList("friends")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "0",
                                            textAlign: "center"
                                        }}
                                    >
                                        <span className="stat-number">{followCounts.friends}</span>
                                        <span className="stat-label">friends</span>
                                    </button>
                                </div>

                                {/* Bio Display */}
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

                                <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                                    Joined {new Date(userProfile.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Posts Grid */}
            <div>
                <h3 style={{ marginBottom: "1rem" }}>Your Posts</h3>

                {userPosts.length === 0 ? (
                    <div className="card" style={{ textAlign: "center" }}>
                        <h4>No posts yet</h4>
                        <p style={{ color: "var(--text-secondary)" }}>
                            You haven't written any posts yet. Start sharing your thoughts and ideas!
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "16px"
                    }}>
                        {userPosts.map((post) => (
                            <div key={post.id} className="post-grid-item" style={{
                                background: "var(--bg-color)",
                                borderRadius: "8px",
                                border: "1px solid var(--border-color)",
                                overflow: "hidden",
                                position: "relative"
                            }}>
                                {post.cover_url && (
                                    <div style={{ aspectRatio: "1", overflow: "hidden" }}>
                                        <img
                                            src={post.cover_url}
                                            alt={post.title}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover"
                                            }}
                                        />
                                    </div>
                                )}

                                <div style={{ padding: "12px" }}>
                                    <h4 style={{
                                        margin: "0 0 8px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>
                                        {post.title}
                                    </h4>
                                    <p style={{
                                        margin: "0 0 12px",
                                        fontSize: "12px",
                                        color: "var(--text-secondary)",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical"
                                    }}>
                                        {post.content}
                                    </p>

                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Link
                                            to={`/post/${post.id}`}
                                            className="btn primary"
                                            style={{
                                                fontSize: "11px",
                                                padding: "4px 8px",
                                                textDecoration: "none",
                                                flex: 1,
                                                textAlign: "center"
                                            }}
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleEditPost(post)}
                                            className="btn secondary"
                                            style={{ fontSize: "11px", padding: "4px 8px" }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => deletePost(post.id)}
                                            style={{
                                                fontSize: "11px",
                                                padding: "4px 8px",
                                                background: "var(--error-color)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Follow Lists Modal */}
            {showFollowList && (
                <FollowList
                    userId={user.id}
                    type={showFollowList}
                    onClose={() => setShowFollowList(null)}
                />
            )}

            {/* Edit Post Modal */}
            {editingPost && (
                <EditPostModal
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onSave={onPostUpdated}
                />
            )}
        </div>
    );
}
