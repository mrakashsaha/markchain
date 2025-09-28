import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthProvider from './contextAPI/AuthProvider.jsx';
import MainLayout from './Layout/MainLayout.jsx';
import AdminLayout from './layout/AdminLayout.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import StudentLayout from './layout/StudentLayout.jsx';
import StudentHome from './pages/student/StudentHome.jsx';

import ContinueWithMetaMask from './pages/user/ContinueWithMetaMask.jsx';
import Register from './pages/user/Register.jsx';

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
        element: <Register></Register>,
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
