import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthProvider from './contextAPI/AuthProvider.jsx';
import AdminLayout from './layout/AdminLayout.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import StudentLayout from './layout/StudentLayout.jsx';
import StudentHome from './pages/student/StudentHome.jsx';

import ContinueWithMetaMask from './pages/user/ContinueWithMetaMask.jsx';
import Register from './pages/user/Register.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import MainLayout from './layout/MainLayout.jsx';
import PendingAccount from './components/PendingAccount.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout></MainLayout>,
    children: [
      {
        path: "/",
        element: <ContinueWithMetaMask></ContinueWithMetaMask>
      },

      {
        path: "/register",
        element: <PrivateRoute><Register></Register></PrivateRoute>,
      },

      {
        path: "/pending",
        element: <PrivateRoute><PendingAccount></PendingAccount></PrivateRoute>,
      },
    ]
  },



  // Admin routes
  {
    path: "/admin",
    element: <AdminLayout></AdminLayout>,
    children: [
      {
        path: "/admin",
        element: <AdminHome></AdminHome>,
      },
    ]
  },



  // Admin routes
  {
    path: "/student",
    element: <StudentLayout></StudentLayout>,
    children: [
      {
        path: "/student",
        element: <StudentHome></StudentHome>,
      },
    ]
  },


]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
