import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function CallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        const userId = auth.user?.profile?.sub;

        if (userId) {
          console.log("✅ Logged in, redirecting to driver screen with ID:", userId);
          navigate("/driverScreen", { replace: true });
        } else {
          console.warn("⚠️ Logged in but no user ID found in profile");
          navigate("/", { replace: true });
        }
      } else {
        console.log("❌ User not authenticated, redirecting to login");
        navigate("/", { replace: true });
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user, navigate]);

  return <p>Logging you in... Please wait.</p>;
}
