import "./App.less";

import MainRouter from "./routers/MainRouter";
import { LocationProvider } from "./contexts/LocationContext";
import { UserProvider } from "./contexts/UserContext";

const App = () => {
  return (
    <UserProvider>
      <LocationProvider>
        <MainRouter />
      </LocationProvider>
    </UserProvider>
  );
};

export default App;
