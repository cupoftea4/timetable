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

function romanToArabic(roman: string): number {
  const romanNumeralMap: Record<string, number> = {
      I: 1,
      V: 5,
      X: 10,
      L: 40,
  };

  let arabicValue = 0;
  let previousValue = 0;
  for (let i = 0; i < roman.length; i++) {
      const currentValue = romanNumeralMap[roman[i]];
      if (!currentValue) return -1;
      arabicValue += currentValue;

      if (currentValue > previousValue) {
          arabicValue -= 2 * previousValue;
      }
      previousValue = currentValue;
  }
  return arabicValue <= 40 ? arabicValue : -1;
}

export function findAndConvertRomanNumeral(input: string): number | null {
  const romanNumeralRegex = /[IVXL]+/;
  const romanNumeral = input.match(romanNumeralRegex);

  if (romanNumeral) {
    const arabicValue = romanToArabic(romanNumeral.toString());
    if (arabicValue !== -1) {
        return arabicValue;
    }
  }
  return null;
}