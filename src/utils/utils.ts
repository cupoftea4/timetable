export async function optimisticRender<T>(
  render: (data: T, optimistic: boolean) => void, 
  error: ((error: string) => void) | (() => void), 
  promises: readonly [Promise<T | null | undefined>, Promise<T| null>]
) {
  const [first, second] = promises;
  try {
    const optData = await first;
    if (optData) render(optData, true);
    const data = await second;
    if (!data && !optData) throw new Error('No data');
    if (!data) return;
    render(data, false);
  } catch (e) {
    if (typeof e === 'string') return error(e);
    error("Unknown error");
  }
}