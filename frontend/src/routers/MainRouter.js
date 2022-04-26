import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import DataPage from "../pages/DataPage";
import ForecastPage from "../pages/ForecastPage";
import { useAPI } from "../LocationContext";

const MainRouter = () => {
  const { locations } = useAPI();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} exact />

        {locations.map((location) => {
          return (
            <>
              <Route
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
              />
            </>
          );
        })}
      </Routes>
    </Router>
  );
};

export default MainRouter;
