import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import CommentList from "../components/CommentList";
import LikeButton from "../components/LikeButton";
import ShareButton from "../components/ShareButton";
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

export default function PostPage() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            fetchPost();
        }
    }, [id]);

    async function fetchPost() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("posts")
                .select(`
                    *,
                    profiles (
                        display_name,
                        profile_image_url
                    )
                `)
                .eq("id", id)
                .single();

            if (error) {
                console.error("Error fetching post:", error);
                setError("Failed to load post");
            } else {
                setPost(data);
            }
        } catch (err) {
            console.error("Error fetching post:", err);
            setError("Failed to load post");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading">Loading post...</div>;
    }

    if (error || !post) {
        return (
            <div className="center-page">
                <h2>Post Not Found</h2>
                <p className="text-muted">
                    {error || "The post you're looking for doesn't exist."}
                </p>
                <Link to="/" className="btn primary" style={{ marginTop: "16px" }}>
                    Back to Home
                </Link>
            </div>
        );
    }

    const authorName = post.profiles?.display_name || "Anonymous";

    return (
        <div>
            <Link to="/" className="btn link" style={{ marginBottom: "24px", display: "inline-flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px" }}>
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to feed
            </Link>

            <article className="post-card">
                {/* Post Header */}
                <div className="post-header">
                    <div className="author-info">
                        <Avatar
                            src={post.profiles?.profile_image_url}
                            alt={`${authorName}'s profile picture`}
                            size="medium"
                            fallbackText={authorName}
                        />
                        <div className="author-details">
                            <h4>{authorName}</h4>
                            <p className="timestamp">
                                {new Date(post.created_at).toLocaleDateString()}
                            </p>
                        </div>
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
                            <ShareButton
                                postId={post.id}
                                title={post.title}
                                url={window.location.href}
                            />
                        </div>
                    </div>

                    <h1 className="post-title" style={{ fontSize: "20px", marginBottom: "12px" }}>
                        {post.title}
                    </h1>

                    <div className="post-text">
                        <span>
                            <strong>{authorName}</strong>{" "}
                            {post.content.split('\n').map((paragraph, index) => (
                                <span key={index}>
                                    {paragraph}
                                    {index < post.content.split('\n').length - 1 && <br />}
                                </span>
                            ))}
                        </span>
                    </div>
                </div>

                {/* Comments */}
                <CommentList postId={post.id} />
            </article>
        </div>
    );
}
