export type IconStyles = { className?: string, style?: React.CSSProperties };

export enum Status {
  Loading,
  Idle,
  Failed
}

export type OptimisticPromise<T> = Promise<T | null | undefined>;
export type ActualPromise<T> = Promise<T | null>;
export type RenderPromises<T> = readonly [OptimisticPromise<T>, ActualPromise<T>];
