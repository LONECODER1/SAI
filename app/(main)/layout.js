import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div className="w-full max-w-[1800px] mx-auto pt-20 sm:pt-24 pb-14 px-3 sm:px-6 lg:px-8">
      {children}
    </div>
  );
};

export default MainLayout;
