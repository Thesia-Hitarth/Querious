import { BrowserRouter as Router } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import ContextBar from "./components/ContextBar/ContextBar";
import AllRoutes from "./AllRoutes";
import { fetchNotifications } from "./actions/notifications";

import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { ToastProvider } from "./components/Toast/ToastContext";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
import { ThemeProvider } from "./components/Theme/ThemeContext";

function App() {
  const dispatch = useDispatch();
  const User = useSelector((state) => state.currentUserReducer);



  useEffect(() => {
    if (!User?.result?._id) {
      return;
    }

    dispatch(fetchNotifications());

    const isSocketEnabled = process.env.REACT_APP_ENABLE_SOCKET === "true" || window.location.hostname === "localhost";

    if (isSocketEnabled) {
      const apiUrl = process.env.REACT_APP_API_URL || 
        (window.location.hostname === "localhost" ? "http://localhost:5000" : window.location.origin);

      const profile = JSON.parse(localStorage.getItem("Profile"));
      const token = profile?.token;

      const socket = io(apiUrl, {
        auth: { token },
        withCredentials: true
      });
      socket.emit("join", User.result._id);

      socket.on("notification", (notif) => {
        dispatch({ type: "ADD_NOTIFICATION", payload: notif });
      });

      return () => {
        socket.disconnect();
      };
    } else {
      // Fallback polling for serverless deployment
      // Optimize: Only poll when the tab is visible to reduce serverless overhead
      const fetchIfVisible = () => {
        if (document.visibilityState === "visible") {
          dispatch(fetchNotifications());
        }
      };

      const interval = setInterval(fetchIfVisible, 30000);

      // Perform initial fetch
      fetchIfVisible();

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          dispatch(fetchNotifications());
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [User?.result?._id, dispatch]);

  const [slideIn, setSlideIn] = useState(true);

  useEffect(() => {
    if (window.innerWidth <= 760) {
      setSlideIn(false);
    }
  }, []);

  const handleSlideIn = () => {
    if (window.innerWidth <= 760) {
      setSlideIn((state) => !state);
    }
  };

  return (
    <ThemeProvider>
      <div className="App">
        <ToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <a
              href="#main-content"
              className="skip-link"
              style={{
                position: "fixed",
                top: "-100px",
                left: "20px",
                background: "var(--color-brand-primary)",
                color: "white",
                padding: "10px 20px",
                borderRadius: "4px",
                zIndex: "99999",
                transition: "top 0.2s ease-in-out",
                textDecoration: "none",
                fontWeight: "bold",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onFocus={(e) => (e.target.style.top = "20px")}
              onBlur={(e) => (e.target.style.top = "-100px")}
            >
              Skip to main content
            </a>
            <Navbar handleSlideIn={handleSlideIn} />
            <ContextBar />
            <main id="main-content">
              <ErrorBoundary>
                <AllRoutes slideIn={slideIn} handleSlideIn={handleSlideIn} />
              </ErrorBoundary>
            </main>
            <ScrollToTop />
          </Router>
        </ToastProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
