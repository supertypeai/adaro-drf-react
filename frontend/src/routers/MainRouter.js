import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "../pages/Home/Home";
import DataPage from "../pages/DataPage/DataPage";
import ForecastPage from "../pages/ForecastPage/ForecastPage";
import LoginPage from "../pages/LoginPage/LoginPage";

const MainRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} exact />
        <Route path="/login" element={<LoginPage />} exact />
        {/* {locations.map((location) => {
          return ( */}
        <>
          {/* <Route
                path={`/locs/${location.id}`}
                element={
                  <DataPage
                    locId={location.id}
                    loc={location.name}
                    locTitle={location.title}
                    locCategory={location.category}
                  />
                }
                exact
              />
              <Route
                path={`/locs/${location.id}/forecast`}
                element={
                  <ForecastPage loc={location.name} locTitle={location.title} />
                }
              /> */}

          <Route path={`/locs/:id`} element={<DataPage />} exact />
          <Route path={`/locs/:id/forecast`} element={<ForecastPage />} />
        </>
      </Routes>
    </Router>
  );
};

export default MainRouter;
