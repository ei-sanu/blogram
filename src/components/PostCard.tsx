import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Avatar from "./Avatar";
import LikeButton from "./LikeButton";
import ShareButton from "./ShareButton";
import UserPreview from "./UserPreview";

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

interface PostCardProps {
    post: Post;
    showActions?: boolean;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
}

export default function PostCard({ post, showActions = false, onEdit, onDelete }: PostCardProps) {
    const { user } = useUser();
    const [showFullContent, setShowFullContent] = useState(false);
    const [commentCount, setCommentCount] = useState(0);
    const [showUserPreview, setShowUserPreview] = useState<{ userId: string; element: HTMLElement } | null>(null);

    useEffect(() => {
        fetchCommentCount();
    }, [post.id]);

    async function fetchCommentCount() {
        try {
            const { count, error } = await supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("post_id", post.id);

            if (!error) {
                setCommentCount(count || 0);
            }
        } catch (error) {
            console.error("Error fetching comment count:", error);
        }
    }

    function handleAvatarClick(userId: string, event: React.MouseEvent) {
        if (userId === user?.id) return; // Don't show preview for own profile

        const element = event.currentTarget as HTMLElement;
        setShowUserPreview({ userId, element });
    }

    if (!post) return null;

    const authorName = post.profiles?.display_name || "Anonymous";
    const contentPreview = post.content.length > 150
        ? post.content.substring(0, 150) + "..."
        : post.content;
    const isOwnPost = user?.id === post.author_id;

    return (
        <article className="post-card">
            {/* Post Header */}
            <div className="post-header">
                <div className="author-info">
                    <div
                        onClick={(e) => handleAvatarClick(post.author_id, e)}
                        style={{ cursor: post.author_id !== user?.id ? "pointer" : "default" }}
                    >
                        <Avatar
                            src={post.profiles?.profile_image_url}
                            alt={`${authorName}'s profile picture`}
                            size="medium"
                            fallbackText={authorName}
                            userId={post.author_id}
                            showFollowOverlay={!isOwnPost}
                        />
                    </div>
                    <div className="author-details">
                        <h4
                            style={{
                                cursor: post.author_id !== user?.id ? "pointer" : "default"
                            }}
                            onClick={(e) => handleAvatarClick(post.author_id, e)}
                        >
                            {authorName}
                        </h4>
                        <p className="timestamp">
                            {new Date(post.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {/* Edit/Delete buttons for own posts */}
                    {showActions && isOwnPost && (
                        <>
                            <button
                                onClick={() => onEdit?.(post)}
                                className="btn secondary"
                                style={{ fontSize: "12px", padding: "4px 8px" }}
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete?.(post.id)}
                                style={{
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    background: "#ed4956",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                }}
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Post Image */}
            {post.cover_url && (
                <img
                    src={post.cover_url}
                    alt={post.title}
                    className="post-image"
                />
            )}

            {/* Post Content */}
            <div className="post-content">
                <div className="post-actions">
                    <div className="action-buttons">
                        <LikeButton postId={post.id} />
                        <Link to={`/post/${post.id}`} className="action-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </Link>
                        <ShareButton
                            postId={post.id}
                            title={post.title}
                        />
                    </div>
                </div>

                <h3 className="post-title">{post.title}</h3>

                <div className="post-text">
                    <span>
                        <strong>{authorName}</strong>{" "}
                        {showFullContent ? post.content : contentPreview}
                        {post.content.length > 150 && !showFullContent && (
                            <button
                                onClick={() => setShowFullContent(true)}
                                className="read-more"
                                style={{ background: "none", border: "none", cursor: "pointer" }}
                            >
                                more
                            </button>
                        )}
                    </span>
                </div>

                {/* Comment Count and View Link */}
                <div style={{ marginTop: "8px" }}>
                    {commentCount > 0 ? (
                        <Link
                            to={`/post/${post.id}`}
                            className="read-more"
                            style={{ fontSize: "14px" }}
                        >
                            View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                        </Link>
                    ) : (
                        <Link
                            to={`/post/${post.id}`}
                            className="read-more"
                            style={{ fontSize: "14px" }}
                        >
                            Be the first to comment
                        </Link>
                    )}
                </div>
            </div>

            {/* User Preview Modal */}
            {showUserPreview && (
                <UserPreview
                    userId={showUserPreview.userId}
                    onClose={() => setShowUserPreview(null)}
                    anchorElement={showUserPreview.element}
                />
            )}
        </article>
    );
}
