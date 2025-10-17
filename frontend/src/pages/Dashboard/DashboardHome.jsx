import { useContext, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AuthContext } from "../../contextAPI/AuthContext";


const DashboardHome = () => {
  const { userInfo } = useContext(AuthContext);
  console.log(userInfo)
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) return;
    else if (userInfo.publicKey === null) navigate("/private-key");
    else if (userInfo?.role === "admin") navigate("/dashboard/admin/home");
    else if (userInfo?.role === "student") navigate("/dashboard/student/home");
    else if (userInfo?.role === "teacher") navigate("/dashboard/teacher/home");
  }, [userInfo, navigate]);

  return <Navigate to={"/"}></Navigate>;
};

export default DashboardHome;
