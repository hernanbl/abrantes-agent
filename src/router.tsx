
import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import ReviewForm from "@/pages/performance/ReviewForm";
import SupervisorView from "@/pages/supervisor/SupervisorView";
import HRManagerView from "@/pages/hr/HRManagerView";
import ProfilePage from "@/pages/profile/ProfilePage";
import { RouteGuard } from "@/components/RouteGuard";
import { ReportsFullPage } from "@/pages/hr/ReportsFullPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    path: "/auth/register",
    element: <Register />,
  },
  {
    path: "/performance/review",
    element: (
      <RouteGuard>
        <ReviewForm />
      </RouteGuard>
    ),
  },
  {
    path: "/performance/review/:employeeId",
    element: (
      <RouteGuard allowedRoles={['supervisor', 'hr_manager']}>
        <ReviewForm />
      </RouteGuard>
    ),
  },
  {
    path: "/supervisor/dashboard",
    element: (
      <RouteGuard allowedRoles={['supervisor']}>
        <SupervisorView />
      </RouteGuard>
    ),
  },
  {
    path: "/hr/dashboard",
    element: (
      <RouteGuard allowedRoles={['hr_manager']}>
        <HRManagerView />
      </RouteGuard>
    ),
  },
  {
    path: "/hr/reports",
    element: (
      <RouteGuard allowedRoles={['hr_manager']}>
        <ReportsFullPage />
      </RouteGuard>
    ),
  },
  {
    path: "/profile",
    element: (
      <RouteGuard>
        <ProfilePage />
      </RouteGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
