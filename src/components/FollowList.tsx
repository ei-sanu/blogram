import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

interface User {
    id: string;
    display_name: string;
    email: string;
    profile_image_url?: string;
    created_at: string;
}

interface FollowListProps {
    userId: string;
    type: "followers" | "following" | "friends";
    onClose: () => void;
}

export default function FollowList({ userId, type, onClose }: FollowListProps) {
    const { user: currentUser } = useUser();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [userId, type]);

    async function fetchUsers() {
        try {
            setLoading(true);
            let query;

            switch (type) {
                case "followers":
                    // Get users who follow this user
                    query = supabase
                        .from("follows")
                        .select(`
                            follower_id,
                            profiles!follows_follower_id_fkey (
                                id,
                                display_name,
                                email,
                                profile_image_url,
                                created_at
                            )
                        `)
                        .eq("following_id", userId);
                    break;

                case "following":
                    // Get users this user follows
                    query = supabase
                        .from("follows")
                        .select(`
                            following_id,
                            profiles!follows_following_id_fkey (
                                id,
                                display_name,
                                email,
                                profile_image_url,
                                created_at
                            )
                        `)
                        .eq("follower_id", userId);
                    break;

                case "friends":
                    // Get mutual follows (friends)
                    const { data: following } = await supabase
                        .from("follows")
                        .select("following_id")
                        .eq("follower_id", userId);

                    if (!following || following.length === 0) {
                        setUsers([]);
                        setLoading(false);
                        return;
                    }

                    const followingIds = following.map(f => f.following_id);

                    // Find users who also follow back
                    query = supabase
                        .from("follows")
                        .select(`
                            follower_id,
                            profiles!follows_follower_id_fkey (
                                id,
                                display_name,
                                email,
                                profile_image_url,
                                created_at
                            )
                        `)
                        .eq("following_id", userId)
                        .in("follower_id", followingIds);
                    break;

                default:
                    setLoading(false);
                    return;
            }

            const { data, error } = await query;

            if (error) {
                console.error(`Error fetching ${type}:`, error);
                setUsers([]);
            } else {
                // Extract user profiles from the nested structure
                const userList = data?.map((item: any) => {
                    if (type === "followers" || type === "friends") {
                        return item.profiles;
                    } else {
                        return item.profiles;
                    }
                }).filter(Boolean) || [];

                setUsers(userList);
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    function getTitle() {
        switch (type) {
            case "followers":
                return "Followers";
            case "following":
                return "Following";
            case "friends":
                return "Friends";
            default:
                return "Users";
        }
    }

    function getEmptyMessage() {
        switch (type) {
            case "followers":
                return "No followers yet";
            case "following":
                return "Not following anyone yet";
            case "friends":
                return "No friends yet. Friends are users you follow who also follow you back.";
            default:
                return "No users found";
        }
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "400px", maxHeight: "80vh" }}>
                <div className="modal-header">
                    <h3 className="modal-title">{getTitle()}</h3>
                    <button onClick={onClose} className="modal-close">
                        ✕
                    </button>
                </div>

                <div className="modal-body" style={{ padding: 0, overflow: "auto" }}>
                    {loading ? (
                        <div className="loading" style={{ padding: "40px" }}>
                            Loading {type}...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="empty-state" style={{ padding: "40px" }}>
                            <p>{getEmptyMessage()}</p>
                        </div>
                    ) : (
                        <div>
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "16px 24px",
                                        borderBottom: "1px solid #efefef"
                                    }}
                                >
                                    <Avatar
                                        src={user.profile_image_url}
                                        alt={`${user.display_name}'s profile picture`}
                                        size="medium"
                                        fallbackText={user.display_name}
                                        style={{ marginRight: "16px" }}
                                    />

                                    <div style={{ flex: 1 }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            marginBottom: "4px"
                                        }}>
                                            {user.display_name}
                                        </h4>
                                        <p style={{
                                            margin: 0,
                                            fontSize: "12px",
                                            color: "#8e8e8e"
                                        }}>
                                            {user.email}
                                        </p>
                                    </div>

                                    {currentUser && currentUser.id !== user.id && (
                                        <FollowButton
                                            targetUserId={user.id}
                                            onFollowChange={fetchUsers}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
