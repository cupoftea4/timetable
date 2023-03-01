import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import TimetableManager from "./utils/TimetableManager";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import TimetablePage from "./pages/TimetablePage";
import LoadingPage from "./pages/LoadingPage";
import * as handler from './utils/requestHandler';
import { Status } from "./utils/types";
import { ToastContainer as MessageToast } from "react-toastify";
import { TOAST_AUTO_CLOSE_TIME } from "./utils/constants";

/* TODO:
  - update partials
  - add partial timetables to timetable-data
  - add Merged timetables
  - fix light theme
  - pwa opens last saved timetable automatically
  - add lines between lectures on mobile
  - fix timetable-data to work even if something goes wrong (like institutes fetching)
  - github actions to commit only diff
  - probably fix different horizontal spacing between lectures
 */

const App = () => {
  const [status, setStatus] = useState<Status>(Status.Loading);

  useEffect(
    () => {
      TimetableManager.init()
        .then(() => setStatus(Status.Idle))
        .catch((e) => {
          setStatus(Status.Failed);
          handler.error(e, handler.INIT_ERROR + ". Try again or use another browser.");
        });
    }, []
  );

  return (
    <>
     {status ?
        <>
          <BrowserRouter>
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
      <MessageToast position="bottom-right" theme="colored" pauseOnFocusLoss={false} autoClose={TOAST_AUTO_CLOSE_TIME} /> 
    </>
  );
};
 
export default App;
