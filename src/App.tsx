import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import TimetableManager from "./utils/TimetableManager";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TimetablePage from "./pages/TimetablePage";
import LoadingPage from "./pages/LoadingPage";
import * as handler from './utils/requestHandler';
import { Status } from "./utils/types";

/* TODO:
  - Jump to the current week day on mobile done?
  - Add exams for teachers
  - Fix showing all items before fetching
  - Themes
  - focusable years
  ? Fix jumping of the timetable when switching between subgroups
  ? Exams timetable icon or any other way to switch between timetables
  ? horizontal scrolling on mobileS
  ? backend for caching
 */
console.log("I hate this world.");

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
        <BrowserRouter basename="/">
          <Routes>
            <Route path="/" element={<HomePage timetableType="timetable"/>} />
            <Route path="selective" element={<HomePage timetableType="selective"/>} />
            <Route path="lecturer" element={<HomePage timetableType="lecturer"/>} />
            <Route path="/:group" element={<TimetablePage/>} />
            <Route path="/:group/exams" element={<TimetablePage isExamsTimetable/>} />
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