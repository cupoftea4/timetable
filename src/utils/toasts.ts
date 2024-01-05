import { toast } from 'react-toastify';
import { DEVELOP, TOAST_AUTO_CLOSE_TIME } from './constants';
import { getRandomValue, isDarkMode } from './general';

const DEBOUNCE_TOAST_TIME = 500;

const initErrors = [
  'The creator run out of imagination, failed to initialize cache',
  'Congratulations your first loading is a failure, like you.....',
  'Congrats, you won a lottery, your cache failed to initialize with a chance of 1 to 10000000000000',
  'The creator is a lazy bum, failed to initialize cache',
  'RIP cache, you will be missed',
  'A cache is a cache, but this one is a failure',
  'Very funny, you broke the cache',
  'NULP is a failure, so is your cache',
  'Bazinga, you broke the cache'
];

const nonexistingGroupErrors = [
  'Hello mythical creature, your group does not exist',
  'As a mathematician I hereby name u imaginal, cause your group is not real',
  'Oh no, your group is not real, go back to Hogwarts',
  'Please, stop trying to break the app, your group does not exist',
  'Cat not found, group not found, what else is not found?',
  'Meow, your group does not exist',
  'Let me guess, you are a wizard, cause your group does not exist'
];

export default class Toast {
  static readonly FETCH_ERROR = 'Due to failed fetch u have no lectures tomorrow, go to sleep 😴';
  static readonly FETCH_PENDING = 'Fetching data';
  static readonly DELETE_TIMETABLE_ERROR = "Couldn't delete timetable, try again later";
  static readonly UPDATE_SUBGROUP_ERROR = "Couldn't update subgroup, try again later";
  static readonly UNKNOWN_ERROR = 'Unknown error, try again later';
  static readonly INIT_ERROR = getRandomValue(initErrors);
  static readonly NONEXISTING_GROUP = getRandomValue(nonexistingGroupErrors);
  static readonly NONEXISTING_TIMETABLE = 'This timetable does not exist';

  static readonly PENDING_MERGED = 'Merging your timetables. Wait a bit, please';

  static error (error: string, userError: string = Toast.FETCH_ERROR) {
    if (DEVELOP) console.error('[Handler] ' + error);
    showErrorToast(userError);
  }

  static warn (message: string) {
    if (DEVELOP) console.warn('[Handler] ' + message);
    showWarningToast(message);
  }

  static promise<T>(promise: Promise<T>, pending: string = Toast.FETCH_PENDING, error?: string) {
    const params = error ? { pending, error } : { pending };
    showPromiseToast(promise, params);
    return promise;
  }

  static hideAllMessages () {
    toast.dismiss();
  }
}

type PromiseToastParams = {
  pending: string
  error: string
} | {
  pending: string
  error?: undefined
};

const pendingToasts = new Set<string>();

function showPromiseToast (promise: Promise<any>, params: PromiseToastParams) {
  let isPromiseResolved = false;
  promise.then(() => { isPromiseResolved = true; });
  setTimeout(() => {
    if (pendingToasts.has(params.pending) || isPromiseResolved) return;
    pendingToasts.add(params.pending);
    toast.promise(promise, params).finally(() => pendingToasts.delete(params.pending));
  }, DEBOUNCE_TOAST_TIME);
}

function showErrorToast (message: string) {
  if (pendingToasts.has(message)) return;
  pendingToasts.add(message);
  toast.error(message);
  setTimeout(() => pendingToasts.delete(message), TOAST_AUTO_CLOSE_TIME);
}

function showWarningToast (message: string) {
  if (pendingToasts.has(message)) return;
  pendingToasts.add(message);
  toast.warn(message, { theme: isDarkMode() ? 'dark' : 'light', hideProgressBar: true });
  setTimeout(() => pendingToasts.delete(message), TOAST_AUTO_CLOSE_TIME);
}
