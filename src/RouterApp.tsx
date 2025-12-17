import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";
import PostPage from "./pages/PostPage";

export default function RouterApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/post/:id" element={<PostPage />} />
            </Routes>
        </BrowserRouter>
    )
}
