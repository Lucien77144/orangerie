import { createBrowserRouter } from "react-router-dom";
import { Home, Hello } from "./pages"; // index by default

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/hello",
        element: <Hello />,
    },
]);