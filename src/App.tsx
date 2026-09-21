import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer as MessageToast } from "react-toastify";
import { useTheme } from "./hooks/useTheme";
import LoadingPage from "./pages/LoadingPage";
import NavigationSelector from "./pages/NavigationSelector";
import { Status } from "./types/utils";
import { RECEIVED_DONATION_NOTIFICATION, TOAST_AUTO_CLOSE_TIME } from "./utils/constants";
import TimetableManager from "./utils/data/TimetableManager";
import { doOnce } from "./utils/general";
import { pathnameToType } from "./utils/timetable";
import Toast from "./utils/toasts";

const HomePage = lazy(() => import("./pages/HomePage"));
const TimetablePage = lazy(() => import("./pages/TimetablePage"));
const WaifuPage = import.meta.env.VITE_ENABLE_WAIFU === "true" ? lazy(() => import("./pages/WaifuPage")) : null;

/* TODO:
  - add tests
  - update partials
  - add partial timetables to timetable-data
  - fix light theme
  - fix timetable-data to work even if something goes wrong (like institutes fetching)
  - github actions to commit only diff
 */

const App = () => {
  // Initialize theme at the app level
  useTheme();

  const [status, setStatus] = useState<Status>(Status.Loading);

  useEffect(() => {
    TimetableManager.init(pathnameToType(window.location.pathname))
      .then(() => {
        setStatus(Status.Idle);
        doOnce(RECEIVED_DONATION_NOTIFICATION, () => {
          Toast.donationNotification();
        });
      })
      .catch((e) => {
        setStatus(Status.Failed);
        Toast.error(e, `${Toast.INIT_ERROR}. Try again or use another browser.`);
      });
  }, []);

  return (
    <>
      {status !== Status.Loading ? (
        <BrowserRouter>
          <Suspense fallback={<LoadingPage />}>
            <Routes>
              <Route path="/" element={<NavigationSelector />} />
              <Route path="home" element={<HomePage timetableType="timetable" />} />
              <Route path="selective" element={<HomePage timetableType="selective" />} />
              <Route path="lecturer" element={<HomePage timetableType="lecturer" />} />
              <Route path="waifu" element={WaifuPage ? <WaifuPage /> : <Navigate to="/home" replace />} />
              <Route path="/:group" element={<TimetablePage />} />
              <Route path="/:group/exams" element={<TimetablePage isExamsTimetable />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      ) : (
        <LoadingPage />
      )}
      <MessageToast
        position="bottom-right"
        theme="colored"
        pauseOnFocusLoss={false}
        autoClose={TOAST_AUTO_CLOSE_TIME}
        closeOnClick
        draggable
      />
    </>
  );
};

export default App;
