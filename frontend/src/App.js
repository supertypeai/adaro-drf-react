import "./App.less";

import MainRouter from "./routers/MainRouter";
import { LocationProvider } from "./contexts/LocationContext";

const App = () => {
  return (
    <LocationProvider>
      <MainRouter />
    </LocationProvider>
  );
};

export default App;
