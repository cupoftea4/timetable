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
        // if (!context) {
        //     context = this
        // }

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