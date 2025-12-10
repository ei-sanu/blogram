import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Header from "./components/Header";
import { useSyncUser } from "./hooks/useSyncUser";
import Home from "./pages/Home";
import PostPage from "./pages/PostPage";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import "./styles/layout.css";

export default function App() {
  useSyncUser();

  return (
    <Router>
      <div className="app-root">
        <Header />

        <main className="page-container">
          <SignedOut>
            <div className="center-page card">
              <h2 className="title">Welcome to your Vlog</h2>
              <p className="muted">Sign in to create posts, comment and like.</p>
              <SignInButton mode="modal">
                <button className="btn primary">Sign In</button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
            </Routes>
          </SignedIn>
        </main>
      </div>
    </Router>
  );
}
