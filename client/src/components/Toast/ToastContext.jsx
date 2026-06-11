import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info") => {
    // If there is already a toast, clear it first
    setToast(null);
    // Allow React state to clear before displaying the next one
    setTimeout(() => {
      setToast({ message, type });
    }, 50);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="toast-portal">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
      )}
    </ToastContext.Provider>
  );
};
