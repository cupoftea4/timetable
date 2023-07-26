import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer as MessageToast } from 'react-toastify';
import HomePage from './pages/HomePage';
import LoadingPage from './pages/LoadingPage';
import TimetablePage from './pages/TimetablePage';
import { TOAST_AUTO_CLOSE_TIME } from './utils/constants';
import Toast from './utils/toasts';
import TimetableManager from './utils/data/TimetableManager';
import { Status } from './types/utils';

/* TODO:
  - add tests
  - update partials
  - add partial timetables to timetable-data
  - fix light theme
  - fix timetable-data to work even if something goes wrong (like institutes fetching)
  - github actions to commit only diff
  - probably fix different horizontal spacing between lectures
 */

const App = () => {
  const [status, setStatus] = useState<Status>(Status.Loading);

  useEffect(
    () => {
      TimetableManager.init()
        .then(() => { setStatus(Status.Idle); })
        .catch((e) => {
          setStatus(Status.Failed);
          Toast.error(e, Toast.INIT_ERROR + '. Try again or use another browser.');
        });
    }, []
  );

  return (
    <>
     {status
       ? <>
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
       : <LoadingPage/>
      }
      <MessageToast
        position="bottom-right" theme="colored" pauseOnFocusLoss={false} autoClose={TOAST_AUTO_CLOSE_TIME}
      />
    </>
  );
};

export default App;
