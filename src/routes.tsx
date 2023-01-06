import { createBrowserRouter } from "react-router-dom";
import { Home, Map } from "./pages/Index";

export const router = createBrowserRouter([
    {
        path: '*' || '/',
        element: <Home />,
    },
    {
        path: "/map",
        element: <Map />,
    },
]);