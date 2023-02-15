import { toast } from "react-toastify"
import { TOAST_AUTO_CLOSE_TIME } from "./constants";


export function timeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Promise timeout'))
    }, ms)

    promise
      .then(value => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(reason => {
        clearTimeout(timer)
        reject(reason)
      })
  })
}

export const throttle = (callable: Function, period: number, context?: Function) => {
    let timeoutId: NodeJS.Timeout;
    let time: number;
    return function () {
        if (time) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if ((Date.now() - time) >= period) {
                    callable.apply(context, arguments);
                    time = Date.now();
                }
            }, period - (Date.now() - time));
        } else {
            callable.apply(context, arguments);
            time = Date.now();
        }
    }
}

const pendingToasts = new Set<string>();

type PromiseToastParams = {
  pending: string;
  error: string;
} | {
  pending: string;
  error?: undefined;
}

export function showPromiseToast(promise: Promise<any>, params: PromiseToastParams) {
  let isPromiseResolved = false;
  promise.then(() => isPromiseResolved = true);
  setTimeout(() => {
    if (pendingToasts.has(params.pending) || isPromiseResolved) return;
    pendingToasts.add(params.pending);
    toast.promise(promise, params).finally(() => pendingToasts.delete(params.pending));
  }, 500);
}

export function showErrorToast(message: string) {
  if (pendingToasts.has(message)) return;
  pendingToasts.add(message);
  toast.error(message);
  setTimeout(() => pendingToasts.delete(message), TOAST_AUTO_CLOSE_TIME);
}

export function showWarningToast(message: string) {
  if (pendingToasts.has(message)) return;
  pendingToasts.add(message);
  toast.warn(message, {theme: "dark", hideProgressBar: true});
  setTimeout(() => pendingToasts.delete(message), TOAST_AUTO_CLOSE_TIME);
}

