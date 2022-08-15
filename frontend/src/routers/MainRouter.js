import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import DataPage from "../pages/DataPage/DataPage";
import ForecastPage from "../pages/ForecastPage/ForecastPage";
import LoginPage from "../pages/LoginPage/LoginPage";
import GoogleDataStudio from "../pages/GoogleDataStudio/GoogleDataStudio";
import ProtectedRoute from "./ProtectedRoute";
import { useLogin } from "../contexts/UserContext";

const MainRouter = () => {
  const { authTokens } = useLogin();

  let token = authTokens ? authTokens : localStorage.getItem("authTokens");

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} exact />
        <Route
          path="/"
          element={
            <ProtectedRoute user={token}>
              <Home />
            </ProtectedRoute>
          }
          exact
        />
        <Route
          path={`/locs/:id`}
          element={
            <ProtectedRoute user={token}>
              <DataPage />
            </ProtectedRoute>
          }
          exact
        />
        <Route
          path={`/locs/:id/forecast`}
          element={
            <ProtectedRoute user={token}>
              <ForecastPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={`/google-data-studio`}
          element={
            <ProtectedRoute user={token}>
              <GoogleDataStudio />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default MainRouter;
