import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import AuthProvider from './contextAPI/AuthProvider.jsx';
import MainLayout from './Layout/MainLayout.jsx';
import UserLogin from './pages/user/UserLogin.jsx';

import AdminLayout from './layout/AdminLayout.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import RegisterStudent from './pages/admin/RegisterStudent.jsx';
import RegisterTeacher from './pages/admin/RegisterTeacher.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout></MainLayout>,
    children: [
      {
        path: "/",
        element: <UserLogin></UserLogin>,
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
      {
        path: "/admin/register-student",
        element: <RegisterStudent></RegisterStudent>
      },
      {
        path: "/admin/register-teacher",
        element: <RegisterTeacher></RegisterTeacher>,
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
