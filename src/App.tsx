import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import TimetableManager from "./utils/TimetableManager";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TimetablePage from "./pages/TimetablePage";
import LoadingPage from "./pages/LoadingPage";

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(
    () => {
      initData().then(() => setIsLoaded(true));
    }, []
  );

  const initData = async () => {
    await TimetableManager.init();
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoaded ? <HomePage/> : <LoadingPage/>} />
        <Route path="/:group" element={isLoaded ? <TimetablePage/> : <LoadingPage/>} />
      </Routes>
    </BrowserRouter>
  );
};
 
export default App;