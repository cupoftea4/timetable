export function optimisticRender<T>(
  render: (data: T, optimistic: boolean) => void, 
  error: ((error: string) => void) | (() => void), 
  promises: readonly [Promise<T | null | undefined>, Promise<T| null>]
) {
  const [first, second] = promises;
  return first.then(optData => { 
    if (optData) render(optData, true);
    second.then(data => {
      if (!data && !optData) throw new Error('No data');
      if (!data) return;
      render(data, false);
    }).catch(error);
  }).catch(error);
}