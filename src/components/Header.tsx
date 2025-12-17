import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
    const location = useLocation();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
            document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
            
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(prefersDark);
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <header className="header">
            <div className="header-content">
                <Link to="/" className="logo">
                    BlogGram
                </Link>

                <div className="nav-links">
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle"
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? '☀️' : '🌙'}
                    </button>

                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="btn primary">Log In</button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <Link
                            to="/"
                            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/profile"
                            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                        >
                            Profile
                        </Link>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-8 h-8"
                                }
                            }}
                        />
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}
