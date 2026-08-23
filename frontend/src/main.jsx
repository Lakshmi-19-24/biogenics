import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import AuthProvider from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";
import "./index.css";

document.documentElement.dataset.theme = localStorage.getItem("theme") || "dark";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
      <AuthProvider>
        <SidebarProvider>
          <Toaster position="top-right" toastOptions={{
            duration:3000,
            style:{
              background:"#111827",
              color:"#F1F5F9",
              border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:"12px",
              fontSize:"13.5px",
              boxShadow:"0 18px 48px rgba(0,0,0,0.38)",
              fontFamily:"Inter,'Be Vietnam Pro',sans-serif",
              fontWeight:500,
            },
            success:{iconTheme:{primary:"#059669",secondary:"#F1F5F9"}},
            error:{iconTheme:{primary:"#dc2626",secondary:"#F1F5F9"}},
          }}/>
          <App />
        </SidebarProvider>
      </AuthProvider>
    </Provider>
  </BrowserRouter>
);
