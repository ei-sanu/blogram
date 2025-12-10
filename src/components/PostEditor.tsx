import React, { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { supabase } from "../lib/supabase";

export default function PostEditor() {
    const { user } = useUser();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    async function uploadFile(file: File) {
        const path = `${user?.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("public/posts").upload(path, file, { upsert: false });
        if (error) throw error;
        const { publicURL } = supabase.storage.from("public/posts").getPublicUrl(path);
        return publicURL;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return alert("Sign in to publish.");

        setLoading(true);
        try {
            let cover_url = null;
            if (file) cover_url = await uploadFile(file);

            await supabase.from("posts").insert({
                author_id: user.id,
                title,
                content,
                cover_url,
                published: true
            });

            setTitle("");
            setContent("");
            setFile(null);
        } catch (err) {
            console.error(err);
            alert("Failed to publish. Check console.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="card" onSubmit={handleSubmit}>
            <input className="input" placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea className="textarea" placeholder="Write something..." value={content} onChange={(e) => setContent(e.target.value)} required />
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="mt-3">
                <button className="btn primary" type="submit" disabled={loading}>{loading ? "Publishing..." : "Publish"}</button>
            </div>
        </form>
    );
}
