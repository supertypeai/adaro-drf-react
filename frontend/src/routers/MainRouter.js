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
                  <DataPage loc={location.name} locTitle={location.title} />
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

        {/* <Route path="/locs/1" element={<DataPage loc="muara_tuhup" />} exact />
        <Route
          path="/locs/1/forecast"
          element={<ForecastPage loc="muara_tuhup" />}
          exact
        />

        <Route path="/locs/2" element={<DataPage loc="puruk_cahu" />} exact />
        <Route
          path="/locs/2/forecast"
          element={<ForecastPage loc="puruk_cahu" />}
          exact
        />

        <Route path="/locs/3" element={<DataPage loc="siwak" />} exact />
        <Route
          path="/locs/3/forecast"
          element={<ForecastPage loc="siwak" />}
          exact
        />

        <Route path="/locs/4" element={<DataPage loc="hasan_basri" />} exact />
        <Route
          path="/locs/4/forecast"
          element={<ForecastPage loc="hasan_basri" />}
          exact
        />

        <Route path="/locs/5" element={<DataPage loc="papar_pujung" />} exact />
        <Route
          path="/locs/5/forecast"
          element={<ForecastPage loc="papar_pujung" />}
          exact
        />

        <Route path="/locs/6" element={<DataPage loc="muara_teweh" />} exact />
        <Route
          path="/locs/6/forecast"
          element={<ForecastPage loc="muara_teweh" />}
          exact
        />

        <Route path="/locs/7" element={<DataPage loc="tarusan" />} exact />
        <Route
          path="/locs/7/forecast"
          element={<ForecastPage loc="tarusan" />}
          exact
        /> */}
      </Routes>
    </Router>
  );
};

export default MainRouter;
