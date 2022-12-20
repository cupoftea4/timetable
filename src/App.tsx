import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import TimetableManager from "./utils/TimetableManager";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TimetablePage from "./pages/TimetablePage";
import LoadingPage from "./pages/LoadingPage";
import * as errors from './utils/errorHandling';


enum Status {
  Loading,
  Idle,
  Failed
}

const App = () => {
  const [status, setStatus] = useState<Status>(Status.Loading);

  useEffect(
    () => {
      TimetableManager.init()
        .then(() => setStatus(Status.Idle))
        .catch((e) => {
          setStatus(Status.Failed);
          errors.handleError(e, errors.INIT_ERROR + ". Try again or use another browser.");
        });
    }, []
  );

  return (
    <BrowserRouter basename="/timetable">
      <Routes>
        <Route path="/" element={status ? <HomePage/> : <LoadingPage/>} />
        <Route path="/:group" element={status ? <TimetablePage/> : <LoadingPage/>} />
      </Routes>
    </BrowserRouter>
  );
};
 
export default App;