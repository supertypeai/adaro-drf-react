import React, { useContext, useState, useEffect, createContext } from "react";
import jwt_decode from "jwt-decode";

const UserContext = createContext();

// const PATH = "https://adaro-data-warehouse.et.r.appspot.com";
const PATH = "http://localhost:8000";

export function UserProvider({ children }) {
  // const [token, setToken] = useState(null);
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem("authTokens")
      ? jwt_decode(localStorage.getItem("authTokens"))
      : null
  );
  const [loading, setLoading] = useState(true);

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    window.localStorage.clear();
  };

  useEffect(() => {
    const updateToken = async () => {
      const response = await fetch(`${PATH}/api/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: authTokens?.refresh }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setAuthTokens(data);
        setUser(jwt_decode(data.access));
        localStorage.setItem("authTokens", JSON.stringify(data));
      } else {
        logoutUser();
      }

      if (loading) {
        setLoading(false);
      }
    };
    if (authTokens) {
      if (loading) {
        updateToken();
      }

      let fourteenMinutes = 1000 * 60 * 14;

      let interval = setInterval(() => {
        if (authTokens) {
          updateToken();
        }
      }, fourteenMinutes);
      return () => clearInterval(interval);
    }
  }, [authTokens, loading]);

  return (
    <UserContext.Provider
      value={{
        authTokens,
        setAuthTokens,
        user,
        logoutUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useLogin() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("Context must be used within a Provider");
  }
  return context;
}
