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
import { themes, type ThemeValue } from './utils/themes';

/* TODO:
  - add tests
  - update partials
  - add partial timetables to timetable-data
  - fix light theme
  - fix timetable-data to work even if something goes wrong (like institutes fetching)
  - github actions to commit only diff
 */

function getInitialTheme() {
  let currentTheme = localStorage.getItem('theme');
  if (!currentTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    currentTheme = prefersDark ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
  }
  return currentTheme as ThemeValue;
}

const App = () => {
  const [status, setStatus] = useState<Status>(Status.Loading);
  const [theme, setTheme] = useState<ThemeValue>(getInitialTheme());

  useEffect(() => {
    const currentTheme = themes.find(t => t.value === theme);
    if (!currentTheme) {
      Toast.error('Theme not found', 'Theme error');
      return;
    }
    const rootStyle = document.documentElement.style;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    rootStyle.setProperty('--bg-clr-1', currentTheme.color1);
    rootStyle.setProperty('--bg-clr-2', currentTheme.color2);
  }, [theme]);

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
    <div data-theme={theme}>
     {status
       ? <>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage timetableType="timetable" setTheme={setTheme}/>} />
              <Route path="selective" element={<HomePage timetableType="selective" setTheme={setTheme}/>} />
              <Route path="lecturer" element={<HomePage timetableType="lecturer" setTheme={setTheme}/>} />
              <Route path="/:group" element={<TimetablePage/>} />
              <Route path="/:group/exams" element={<TimetablePage isExamsTimetable/>} />
            </Routes>
          </BrowserRouter>
        </>
       : <LoadingPage/>
      }
      <MessageToast
        position="bottom-right" theme="colored" pauseOnFocusLoss={false} autoClose={TOAST_AUTO_CLOSE_TIME} limit={1}
      />
    </div>
  );
};

export default App;
