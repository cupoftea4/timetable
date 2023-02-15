export function optimisticRender<T>(
  render: (data: T) => void, 
  error: ((error: string) => void) | (() => void), 
  promises: readonly [Promise<T>, Promise<T| null>]
) {
  const [first, second] = promises;
  return first.then(data => {    
    render(data);
    second.then(data => {
      if (!data) return;
      render(data);
    }).catch(error);
  }).catch(error);
}