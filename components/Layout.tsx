
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden max-w-[480px] mx-auto bg-white dark:bg-slate-900 shadow-sm sm:my-4 sm:rounded-xl sm:border sm:border-slate-100 dark:sm:border-slate-800">
      {children}
    </div>
  );
};

export default Layout;
