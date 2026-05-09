import { Bell } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import UserDropdown from "./UserDropdown";
import { parseJwt } from "../../services/authService";

const UserLayout = () => {
  const [currentDate, setCurrentDate] = useState("");
  const [userData, setUserData] = useState(null); // State lưu thông tin user
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(new Date().toLocaleDateString("vi-VN", options));
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setIsLoading(false);
          return;
        }

        const decodedPayload = parseJwt(token);
        if (decodedPayload && decodedPayload.sub) {
          const email = decodedPayload.sub;
          const response = await userService.getUserByEmail(email);
          const user = response.data || response;
          setUserData(user);
        }
      } catch (error) {
        console.error("Lỗi tải thông tin Header:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0">
          <h2 className="text-lg font-bold text-[#1c72bd]">
            PHẦN MỀM QUẢN LÝ KHO
          </h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell
                size={20}
                className="text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <p className="text-sm text-slate-500 font-medium hidden sm:block">
              {currentDate}
            </p>
            <UserDropdown
              userData={userData}
              setUserData={setUserData}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </section>
      </main>
    </>
  );
};

export default UserLayout;
