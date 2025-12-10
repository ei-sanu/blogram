import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Avatar from "./Avatar";
import UserPreview from "./UserPreview";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
        display_name?: string;
        profile_image_url?: string;
    };
}

interface CommentListProps {
    postId: string;
}

export default function CommentList({ postId }: CommentListProps) {
    const { user } = useUser();
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentCount, setCommentCount] = useState(0);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserProfile, setCurrentUserProfile] = useState<{ profile_image_url?: string; display_name?: string } | null>(null);
    const [showUserPreview, setShowUserPreview] = useState<{ userId: string; element: HTMLElement } | null>(null);

    useEffect(() => {
        if (postId) {
            fetchComments();
            fetchCommentCount();
        }
    }, [postId]);

    useEffect(() => {
        if (user) {
            fetchCurrentUserProfile();
        }
    }, [user]);

    async function fetchCurrentUserProfile() {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("profile_image_url, display_name")
                .eq("id", user.id)
                .single();

            if (!error && data) {
                setCurrentUserProfile(data);
            }
        } catch (error) {
            console.error("Error fetching current user profile:", error);
        }
    }

    async function fetchComments() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("comments")
                .select(`
                    *,
                    profiles (
                        display_name,
                        profile_image_url
                    )
                `)
                .eq("post_id", postId)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching comments:", error);
            } else {
                setComments(data || []);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchCommentCount() {
        try {
            const { count, error } = await supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("post_id", postId);

            if (!error) {
                setCommentCount(count || 0);
            }
        } catch (error) {
            console.error("Error fetching comment count:", error);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !newComment.trim() || submitting) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("comments")
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: newComment.trim()
                });

            if (error) {
                console.error("Error adding comment:", error);
            } else {
                setNewComment("");
                fetchComments();
                fetchCommentCount();
            }
        } catch (error) {
            console.error("Error adding comment:", error);
        } finally {
            setSubmitting(false);
        }
    }

    function handleAvatarClick(userId: string, event: React.MouseEvent) {
        if (userId === user?.id) return; // Don't show preview for own profile

        const element = event.currentTarget as HTMLElement;
        setShowUserPreview({ userId, element });
    }

    return (
        <div className="comments-section">
            {/* Comment Count Header */}
            <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #efefef",
                background: "#fafafa"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h4 style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#262626"
                    }}>
                        Comments
                    </h4>
                    <span style={{
                        fontSize: "12px",
                        background: commentCount > 0 ? "#0095f6" : "#e0e0e0",
                        color: commentCount > 0 ? "white" : "#8e8e8e",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontWeight: "500"
                    }}>
                        {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                    </span>
                </div>
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="loading" style={{ padding: "20px" }}>Loading comments...</div>
            ) : (
                <div className="comments-list">
                    {comments.map((comment) => {
                        const authorName = comment.profiles?.display_name || "Anonymous";
                        return (
                            <div key={comment.id} className="comment-item">
                                <div
                                    onClick={(e) => handleAvatarClick(comment.user_id, e)}
                                    style={{ cursor: comment.user_id !== user?.id ? "pointer" : "default" }}
                                >
                                    <Avatar
                                        src={comment.profiles?.profile_image_url}
                                        alt={`${authorName}'s profile picture`}
                                        size="medium"
                                        fallbackText={authorName}
                                        userId={comment.user_id}
                                        showFollowOverlay={comment.user_id !== user?.id}
                                        onFollowChange={fetchComments}
                                    />
                                </div>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span
                                            className="comment-author"
                                            style={{
                                                cursor: comment.user_id !== user?.id ? "pointer" : "default"
                                            }}
                                            onClick={(e) => handleAvatarClick(comment.user_id, e)}
                                        >
                                            {authorName}
                                        </span>
                                        <span className="comment-time">
                                            {getTimeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <p className="comment-text">{comment.content}</p>
                                </div>
                            </div>
                        );
                    })}

                    {commentCount === 0 && !loading && (
                        <div className="empty-state" style={{ padding: "40px 16px" }}>
                            <p style={{ margin: 0, color: "#8e8e8e", fontSize: "14px" }}>
                                No comments yet. Be the first to comment!
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Comment Form */}
            {user && (
                <form onSubmit={handleSubmit} className="comment-form">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                            src={currentUserProfile?.profile_image_url || user.imageUrl}
                            alt="Your profile picture"
                            size="small"
                            fallbackText={currentUserProfile?.display_name || user.firstName || "U"}
                            style={{ marginRight: "12px" }}
                        />
                        <textarea
                            className="comment-input"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={1}
                            style={{
                                resize: "none",
                                overflow: "hidden",
                                flex: 1
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = "auto";
                                target.style.height = Math.min(target.scrollHeight, 100) + "px";
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <button
                            type="submit"
                            className="comment-submit"
                            disabled={submitting || !newComment.trim()}
                            style={{
                                marginLeft: "12px",
                                opacity: (!newComment.trim() || submitting) ? 0.5 : 1
                            }}
                        >
                            {submitting ? "..." : "Post"}
                        </button>
                    </div>
                </form>
            )}

            {/* User Preview Modal */}
            {showUserPreview && (
                <UserPreview
                    userId={showUserPreview.userId}
                    onClose={() => setShowUserPreview(null)}
                    anchorElement={showUserPreview.element}
                />
            )}
        </div>
    );
}

// Helper function to show time ago
function getTimeAgo(dateString: string): string {
    const now = new Date();
    const commentDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}d`;
    } else {
        return commentDate.toLocaleDateString();
    }
}
