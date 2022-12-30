import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import TimetableManager from "./utils/TimetableManager";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TimetablePage from "./pages/TimetablePage";
import LoadingPage from "./pages/LoadingPage";
import * as handler from './utils/requestHandler';
import { Status } from "./utils/types";

/* TODO:
  - Fix jumping of the timetable when switching between subgroups
  - Add components for different timetable types (e.g. for teachers)
  - Jump to the current week day on mobile
  - Not all groups fetch exams timetable successfully
  - Exams timetable item styles
  - Exams timetable icon or any other way to switch between timetables
  - Themes
  - horizontal scrolling on mobileS
 */

const App = () => {
  const [status, setStatus] = useState<Status>(Status.Loading);

  useEffect(
    () => {
      TimetableManager.init()
        .then(() => setStatus(Status.Idle))
        .catch((e) => {
          setStatus(Status.Failed);
          handler.handleError(e, handler.INIT_ERROR + ". Try again or use another browser.");
        });
    }, []
  );

  return (
    <>
     {status ?
      <>
        <BrowserRouter basename="/timetable">
          <Routes>
            <Route path="/" element={<HomePage timetableType="timetable"/>} />
            <Route path="selective" element={<HomePage timetableType="selective"/>} />
            <Route path="lecturer" element={<HomePage timetableType="lecturer"/>} />
            <Route path="/:group" element={<TimetablePage/>} />
          </Routes>
        </BrowserRouter>
      </> 
       :
      <LoadingPage/>
      }
    </>
  );
};
 
export default App;