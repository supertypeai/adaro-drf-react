import React, { useContext, useState, useEffect, createContext } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [token, setToken] = useState(null);
  useEffect(() => {
    setToken(sessionStorage.getItem("token"));
  }, []);
  return (
    <UserContext.Provider
      value={{
        token,
        setToken,
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
