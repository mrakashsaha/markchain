import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../contextAPI/AuthContext";


const DashboardHome = () => {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userInfo?.role === "admin") navigate("/dashboard/admin/home");
    else if (userInfo?.role === "student") navigate("/dashboard/student/home");
    else if (userInfo?.role === "teacher") navigate("/dashboard/teacher/home");
  }, [userInfo, navigate]);

  return <p>Loading dashboard...</p>;
};

export default DashboardHome;
