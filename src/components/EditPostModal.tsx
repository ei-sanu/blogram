import { useEffect, useState } from "react";
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

interface EditPostModalProps {
    post: Post;
    onClose: () => void;
    onSave: (updatedPost: Post) => void;
}

export default function EditPostModal({ post, onClose, onSave }: EditPostModalProps) {
    const [title, setTitle] = useState(post.title);
    const [content, setContent] = useState(post.content);
    const [imageUrl, setImageUrl] = useState(post.cover_url || "");
    const [submitting, setSubmitting] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Check if image URL is valid when component mounts or URL changes
    useEffect(() => {
        if (imageUrl.trim()) {
            checkImageUrl(imageUrl.trim());
        } else {
            setImageError(false);
            setImageLoading(false);
            setShowPreview(false);
        }
    }, [imageUrl]);

    function isValidUrl(string: string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    function checkImageUrl(url: string) {
        if (!isValidUrl(url)) {
            setImageError(true);
            setImageLoading(false);
            setShowPreview(false);
            return;
        }

        setImageLoading(true);
        setImageError(false);
        setShowPreview(false);

        // Create a test image to check if URL is valid
        const testImage = new Image();

        testImage.onload = () => {
            setImageLoading(false);
            setImageError(false);
            setShowPreview(true);
        };

        testImage.onerror = () => {
            setImageLoading(false);
            setImageError(true);
            setShowPreview(false);
        };

        testImage.src = url;
    }

    async function handleSave() {
        if (!title.trim() || !content.trim() || submitting) return;

        // Validate image URL if provided
        if (imageUrl.trim() && !isValidUrl(imageUrl.trim())) {
            alert('Please enter a valid image URL');
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase
                .from("posts")
                .update({
                    title: title.trim(),
                    content: content.trim(),
                    cover_url: imageUrl.trim() || null
                })
                .eq("id", post.id)
                .select(`
                    *,
                    profiles (
                        display_name,
                        profile_image_url
                    )
                `)
                .single();

            if (error) {
                console.error("Error updating post:", error);
                alert('Failed to update post. Please try again.');
            } else {
                onSave(data);
            }
        } catch (error) {
            console.error("Error updating post:", error);
            alert('Failed to update post. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    function clearImage() {
        setImageUrl("");
        setImageError(false);
        setImageLoading(false);
        setShowPreview(false);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-post-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Edit Post</h3>
                    <button className="close-btn" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body">
                    <form className="edit-form">
                        {/* Title Field */}
                        <div className="form-field">
                            <label className="field-label">Post Title</label>
                            <div className="field-container">
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="form-input"
                                    placeholder="Enter post title..."
                                />
                            </div>
                        </div>

                        {/* Content Field */}
                        <div className="form-field">
                            <label className="field-label">Content</label>
                            <div className="field-container">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="form-input content-input"
                                    placeholder="Share your thoughts..."
                                    rows={8}
                                />
                            </div>
                        </div>

                        {/* Image URL Field */}
                        <div className="form-field">
                            <label className="field-label">
                                Cover Image <span className="optional-text">(Optional)</span>
                            </label>
                            <div className={`field-container ${imageError ? 'field-error' : showPreview ? 'field-success' : ''}`}>
                                <div className="url-input-wrapper">
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="form-input url-input"
                                        placeholder="https://example.com/your-image.jpg"
                                    />
                                    {imageUrl.trim() && (
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="clear-url-btn"
                                            title="Clear image URL"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Status Messages */}
                                <div className="image-status">
                                    {imageLoading && (
                                        <div className="status-message loading">
                                            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                            </svg>
                                            Checking image...
                                        </div>
                                    )}

                                    {imageError && imageUrl.trim() && (
                                        <div className="status-message error">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="15" y1="9" x2="9" y2="15" />
                                                <line x1="9" y1="9" x2="15" y2="15" />
                                            </svg>
                                            Invalid image URL or image failed to load
                                        </div>
                                    )}

                                    {showPreview && !imageError && !imageLoading && (
                                        <div className="status-message success">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20,6 9,17 4,12" />
                                            </svg>
                                            Image loaded successfully
                                        </div>
                                    )}

                                    {!imageUrl.trim() && (
                                        <p className="field-help">
                                            Enter a valid image URL to add a cover image to your post
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Enhanced Image Preview */}
                        {showPreview && !imageError && !imageLoading && (
                            <div className="form-field preview-field">
                                <div className="preview-header">
                                    <label className="field-label">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        Live Preview
                                    </label>
                                    <span className="preview-badge">✓ Ready</span>
                                </div>
                                <div className="field-container preview-container">
                                    <div className="image-preview-wrapper">
                                        <img
                                            src={imageUrl.trim()}
                                            alt="Cover image preview"
                                            className="image-preview"
                                            loading="lazy"
                                        />
                                        <div className="preview-overlay">
                                            <div className="preview-info">
                                                <p>This is how your cover image will appear in the post</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Post Preview Card */}
                                    <div className="post-preview-card">
                                        <h4>Post Preview:</h4>
                                        <div className="mini-post-card">
                                            <div className="mini-post-image">
                                                <img src={imageUrl.trim()} alt="Post preview" />
                                            </div>
                                            <div className="mini-post-content">
                                                <h5>{title || "Your post title"}</h5>
                                                <p>{content.slice(0, 100)}{content.length > 100 ? "..." : ""}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Action Buttons */}
                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={submitting || !title.trim() || !content.trim() || imageLoading}
                    >
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
