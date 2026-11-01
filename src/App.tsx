import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer as MessageToast } from "react-toastify";
import { CatModeProvider } from "./context/catMode";
import { useTheme } from "./hooks/useTheme";
import LoadingPage from "./pages/LoadingPage";
import NavigationSelector from "./pages/NavigationSelector";
import TimetablePage from "./pages/TimetablePage";
import { Status } from "./types/utils";
import { TOAST_AUTO_CLOSE_TIME } from "./utils/constants";
import TimetableManager from "./utils/data/TimetableManager";
import { lazyPrefetched } from "./utils/general";
import { pathnameToType } from "./utils/timetable";
import Toast from "./utils/toasts";

// The timetable page is the one most visits open, so only it is in the main bundle
const HomePage = lazyPrefetched(() => import("./pages/HomePage"));
const WaifuPage = import.meta.env.VITE_ENABLE_WAIFU === "true" ? lazy(() => import("./pages/WaifuPage")) : null;

const App = () => {
  useTheme();

  const [status, setStatus] = useState<Status>(Status.Loading);

  useEffect(() => {
    // Loaded with the data so opening the home page doesn't suspend and wait React's 300ms
    Promise.all([TimetableManager.init(pathnameToType(window.location.pathname)), HomePage.preload()])
      .then(() => {
        setStatus(Status.Idle);
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
          <CatModeProvider>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/" element={<NavigationSelector />} />
                <Route path="home" element={<HomePage timetableType="regular" />} />
                <Route path="selective" element={<HomePage timetableType="selective" />} />
                <Route path="lecturer" element={<HomePage timetableType="lecturer" />} />
                <Route path="postgraduate" element={<HomePage timetableType="postgraduate" />} />
                <Route path="waifu" element={WaifuPage ? <WaifuPage /> : <Navigate to="/home" replace />} />
                <Route path="/c/:id" element={<TimetablePage />} />
                <Route path="/:group" element={<TimetablePage />} />
                <Route path="/:group/exams" element={<TimetablePage isExamsTimetable />} />
              </Routes>
            </Suspense>
          </CatModeProvider>
        </BrowserRouter>
      ) : (
        <LoadingPage />
      )}
      <MessageToast
        className="[--toastify-toast-width:23rem] max-[480px]:[--toastify-toast-min-height:5rem]"
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
