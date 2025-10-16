import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthProvider from './contextAPI/AuthProvider.jsx';
import ContinueWithMetaMask from './pages/user/ContinueWithMetaMask.jsx';
import Register from './pages/user/Register.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import MainLayout from './layout/MainLayout.jsx';
import PendingAccount from './components/PendingAccount.jsx';
import DashboardLayout from './layout/DashboardLayout.jsx';
import DashboardHome from './pages/Dashboard/DashboardHome.jsx';
import ManageUsers from './pages/Dashboard/admin/ManageUser.jsx';
import RejectedAccount from './components/RejectedAccount.jsx';
import ManageSemester from './pages/Dashboard/admin/ManageSemester.jsx';
import AdminHome from './pages/Dashboard/admin/AdminHome';
import CreateCourses from './pages/Dashboard/admin/CreateCourses.jsx';
import ManageAssignedCourses from './pages/Dashboard/admin/ManageAssignedCourses.jsx';
import EnrollCourses from './pages/Dashboard/student/EnrollCourses.jsx';
import MyCourses from './pages/Dashboard/student/MyCourses.jsx';



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
      {
        path: "/reject",
        element: <PrivateRoute><RejectedAccount></RejectedAccount></PrivateRoute>,
      },
    ]
  },

  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [

      {
        index: true,
        element: <DashboardHome></DashboardHome>
      },

      {
        path: "admin/home",
        element: <AdminHome></AdminHome>,
      },
      {
        path: "admin/manage-users",
        element: <ManageUsers></ManageUsers>,
      },
      {
        path: "admin/manage-semesters",
        element: <ManageSemester></ManageSemester>,
      },
      {
        path: "admin/create-course",
        element: <CreateCourses></CreateCourses>,
      },
      {
        path: "admin/assign-course",
        element: <ManageAssignedCourses></ManageAssignedCourses>,
      },

      // ========================= STUDENT ROUTES =========================
      {
        path: "student/home",
        element: <h2>Student Dashboard Home</h2>,
      },
      {
        path: "student/my-course",
        element: <MyCourses></MyCourses>,
      },
      {
        path: "student/enroll-courses",
        element: <EnrollCourses></EnrollCourses>,
      },
      {
        path: "student/results",
        element: <h2>My Results</h2>,
      },

      // ========================= TEACHER ROUTES =========================
      {
        path: "teacher/home",
        element: <h2>Teacher Dashboard Home</h2>,
      },
      {
        path: "teacher/my-courses",
        element: <h2>Courses I Teach</h2>,
      },
      {
        path: "teacher/student-list",
        element: <h2>View Enrolled Students</h2>,
      },
      {
        path: "teacher/grade-submission",
        element: <h2>Submit Grades</h2>,
      },
    ]
  },



  // Admin routes
  // {
  //   path: "/admin2",
  //   element: <AdminLayout></AdminLayout>,
  //   children: [
  //     {
  //       path: "/admin2",
  //       element: <AdminHome></AdminHome>,
  //     },
  //   ]
  // },



  // Admin routes
  // {
  //   path: "/student2",
  //   element: <StudentLayout></StudentLayout>,
  //   children: [
  //     {
  //       path: "/student2",
  //       element: <StudentHome></StudentHome>,
  //     },
  //   ]
  // },


]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
