import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import PostCard from "./PostCard";

export default function Feed() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();

        const subscription = supabase
            .channel('public:posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    async function fetchPosts() {
        setLoading(true);
        const { data } = await supabase.from("posts").select("*, profiles(*)").order("created_at", { ascending: false }).limit(50);
        setPosts(data || []);
        setLoading(false);
    }

    if (loading) return <div className="card">Loading feed...</div>;

    return (
        <div className="space-y-4">
            {posts.length === 0 && <div className="card muted">No posts yet — be the first!</div>}
            {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
    );
}
