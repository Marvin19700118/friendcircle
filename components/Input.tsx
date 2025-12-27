
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  isToggled?: boolean;
}

const Input: React.FC<InputProps> = ({ label, icon, showToggle, onToggle, isToggled, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[#111418] dark:text-slate-200 text-sm font-medium leading-normal ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111418] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-[#dbe0e6] dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-primary h-12 placeholder:text-[#939ba6] dark:placeholder:text-slate-500 px-[15px] text-base font-normal leading-normal transition-all"
          {...props}
        />
        {(icon || showToggle) && (
          <div className="absolute right-3 top-0 h-full flex items-center text-slate-400">
            {showToggle ? (
              <button
                type="button"
                onClick={onToggle}
                className="hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                  {isToggled ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {icon}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Input;
