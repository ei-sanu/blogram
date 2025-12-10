import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
import Avatar from "../components/Avatar";
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
    profile_image_url?: string;
}

export default function Home() {
    const { user } = useUser();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "following">("all");
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    // Create post form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCurrentUserProfile();
            fetchPosts();
        }
    }, [filter, user]);

    async function fetchCurrentUserProfile() {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, display_name, profile_image_url")
                .eq("id", user.id)
                .single();

            if (!error && data) {
                setCurrentUserProfile(data);
            }
        } catch (error) {
            console.error("Error fetching current user profile:", error);
        }
    }

    async function fetchPosts() {
        try {
            setLoading(true);
            let query = supabase
                .from("posts")
                .select(`
                    *,
                    profiles (
                        display_name,
                        profile_image_url
                    )
                `)
                .order("created_at", { ascending: false });

            if (filter === "following" && user) {
                const { data: followingData } = await supabase
                    .from("follows")
                    .select("following_id")
                    .eq("follower_id", user.id);

                if (followingData && followingData.length > 0) {
                    const followingIds = followingData.map(f => f.following_id);
                    followingIds.push(user.id);
                    query = query.in("author_id", followingIds);
                } else {
                    query = query.eq("author_id", user.id);
                }
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching posts:", error);
            } else {
                setPosts(data || []);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    }

    function isValidUrl(string: string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async function handleCreatePost(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !title.trim() || !content.trim() || submitting) return;

        // Validate image URL if provided
        if (imageUrl.trim() && !isValidUrl(imageUrl.trim())) {
            alert('Please enter a valid image URL');
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase
                .from("posts")
                .insert({
                    title: title.trim(),
                    content: content.trim(),
                    cover_url: imageUrl.trim() || null,
                    author_id: user.id
                })
                .select(`
                    *,
                    profiles (
                        display_name,
                        profile_image_url
                    )
                `)
                .single();

            if (error) {
                console.error("Error creating post:", error);
                alert('Failed to create post. Please try again.');
            } else {
                // Add new post to the beginning of the list
                setPosts([data, ...posts]);

                // Reset form
                resetCreateForm();
            }
        } catch (error) {
            console.error("Error creating post:", error);
            alert('Failed to create post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    function resetCreateForm() {
        setTitle("");
        setContent("");
        setImageUrl("");
        setShowCreateForm(false);
    }

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            {/* Welcome Header */}
            <div className="card" style={{ marginBottom: "2rem", textAlign: "center" }}>
                <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem" }}>
                    Welcome to MyBlog
                </h1>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                    Discover stories, thinking, and expertise from writers on any topic.
                </p>
            </div>

            {/* Create Post Section */}
            {user && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                    {!showCreateForm ? (
                        <div
                            onClick={() => setShowCreateForm(true)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px",
                                cursor: "pointer",
                                borderRadius: "8px",
                                transition: "background-color 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "var(--bg-secondary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            <Avatar
                                src={currentUserProfile?.profile_image_url || user.imageUrl}
                                alt="Your profile picture"
                                size="medium"
                                fallbackText={currentUserProfile?.display_name || user.firstName || "U"}
                            />
                            <div
                                style={{
                                    flex: 1,
                                    padding: "12px 16px",
                                    background: "var(--bg-secondary)",
                                    borderRadius: "24px",
                                    color: "var(--text-secondary)",
                                    fontSize: "14px"
                                }}
                            >
                                What's on your mind? Share your thoughts...
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreatePost}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginBottom: "20px"
                            }}>
                                <Avatar
                                    src={currentUserProfile?.profile_image_url || user.imageUrl}
                                    alt="Your profile picture"
                                    size="medium"
                                    fallbackText={currentUserProfile?.display_name || user.firstName || "U"}
                                />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "16px" }}>
                                        {currentUserProfile?.display_name || user.firstName || "Anonymous"}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>
                                        Creating a new post
                                    </p>
                                </div>
                            </div>

                            {/* Title Input */}
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="form-input"
                                placeholder="Give your post a title..."
                                required
                                style={{
                                    width: "100%",
                                    marginBottom: "16px",
                                    fontSize: "18px",
                                    fontWeight: "600"
                                }}
                            />

                            {/* Content Textarea */}
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="form-input"
                                placeholder="Share your story, thoughts, or ideas..."
                                required
                                rows={6}
                                style={{
                                    width: "100%",
                                    resize: "vertical",
                                    marginBottom: "16px",
                                    fontSize: "16px",
                                    lineHeight: "1.5"
                                }}
                            />

                            {/* Image URL Input */}
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="form-input"
                                placeholder="Image URL (optional) - https://example.com/image.jpg"
                                style={{
                                    width: "100%",
                                    marginBottom: "16px",
                                    fontSize: "14px"
                                }}
                            />

                            {/* Image Preview */}
                            {imageUrl.trim() && isValidUrl(imageUrl.trim()) && (
                                <div style={{ marginBottom: "16px" }}>
                                    <p style={{
                                        fontSize: "12px",
                                        color: "var(--text-secondary)",
                                        marginBottom: "8px"
                                    }}>
                                        Image Preview:
                                    </p>
                                    <img
                                        src={imageUrl.trim()}
                                        alt="Image preview"
                                        style={{
                                            width: "100%",
                                            maxHeight: "300px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            border: "1px solid var(--border-color)"
                                        }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = "none";
                                        }}
                                        onLoad={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = "block";
                                        }}
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={resetCreateForm}
                                    className="btn btn-secondary"
                                    disabled={submitting}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting || !title.trim() || !content.trim()}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 8l-3-3m-3.5 3.5L19 4"/>
                                    </svg>
                                    {submitting ? "Publishing..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Filter Tabs */}
            <div style={{
                marginBottom: "2rem",
                display: "flex",
                gap: "1rem",
                borderBottom: "1px solid var(--border-color)"
            }}>
                <button
                    onClick={() => setFilter("all")}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "1rem 0",
                        fontSize: "16px",
                        fontWeight: "500",
                        color: filter === "all" ? "var(--primary-color)" : "var(--text-secondary)",
                        borderBottom: filter === "all" ? "2px solid var(--primary-color)" : "2px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                    }}
                >
                    All Posts
                </button>
                <button
                    onClick={() => setFilter("following")}
                    style={{
                        background: "none",
                        border: "none",
                        padding: "1rem 0",
                        fontSize: "16px",
                        fontWeight: "500",
                        color: filter === "following" ? "var(--primary-color)" : "var(--text-secondary)",
                        borderBottom: filter === "following" ? "2px solid var(--primary-color)" : "2px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                    }}
                >
                    Following
                </button>
            </div>

            {/* Posts Feed */}
            {loading ? (
                <div className="center-page">
                    <div className="loading">Loading posts...</div>
                </div>
            ) : posts.length === 0 ? (
                <div className="card" style={{ textAlign: "center" }}>
                    <h3>No posts yet</h3>
                    <p style={{ color: "var(--text-secondary)" }}>
                        {filter === "following"
                            ? "You're not following anyone yet, or the people you follow haven't posted anything."
                            : "No posts have been created yet. Be the first to share your thoughts!"
                        }
                    </p>
                </div>
            ) : (
                <div className="posts-feed">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}
