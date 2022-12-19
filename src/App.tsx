import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import TimetableManager from "./utils/TimetableManager";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TimetablePage from "./pages/TimetablePage";
import LoadingPage from "./pages/LoadingPage";

/*
TODO:
  - add data-attributes and aria-labels to elements
  - make custom hooks from useEffects
  - add webkit css
  - add error handling
*/

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(
    () => {
      TimetableManager.init().then(() => setIsLoaded(true));
    }, []
  );

  return (
    <BrowserRouter basename="/timetable">
      <Routes>
        <Route path="/" element={isLoaded ? <HomePage/> : <LoadingPage/>} />
        <Route path="/:group" element={isLoaded ? <TimetablePage/> : <LoadingPage/>} />
      </Routes>
    </BrowserRouter>
  );
};
 
export default App;