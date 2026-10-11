import { type ComponentType, createElement, lazy } from "react";
import type { RenderPromises } from "@/types/utils";
import { SEEN_FEATURES_INTRO } from "./constants";
import { getCurrentUADate } from "./date";

/**
 * Renders the optimistic data first, then the real data if possible.
 * It takes in two promises, that return data to be rendered.
 * For rendering it uses the `render` callback and for errors it uses the `error` callback.
 * @param render - A function that renders the data
 * @param error - A function that handles errors
 * @param promises - An array of two promises that return data to be rendered
 */
export async function optimisticRender<T>(
  render: (data: T, optimistic: boolean) => void,
  error: ((error: string) => void) | (() => void),
  promises: RenderPromises<T>
) {
  const [first, second] = promises;
  try {
    const optData = await first;
    if (optData) render(optData, true);
    const data = await second;
    if (!data && !optData) throw new Error("No data");
    if (!data) return;
    render(data, false);
  } catch (e) {
    if (typeof e === "string") {
      error(e);
      return;
    }
    console.error(e);
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
    const character = roman[i];
    if (!character) return -1;
    const currentValue = romanNumeralMap[character];
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

/**
 * Basic hash function.
 * @param str - The string to hash
 * @returns The hash of the string as a number
 */
export function hashCode(str: string) {
  let hash = 0;
  if (str.length === 0) {
    return hash;
  }
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

export function getRandomValue<T>(array: T[]) {
  // biome-ignore lint/style/noNonNullAssertion: this actually should be fine
  return array[Math.floor(Math.random() * array.length)]!;
}

export function isDarkMode() {
  const theme = window.localStorage.getItem("color-mode");
  return theme === null ? window.matchMedia("(prefers-color-scheme: dark)").matches : theme === "dark";
}

/**
 * Removes all line breaks from a string and replaces them with spaces.
 *
 * @param str - The string to format
 * @returns Formatted string
 */
export function removeLineBreaks(str: string) {
  return str.replace(/[\r\n]+/g, " ").trim();
}

export function doOnce(id: string, fn: () => void) {
  if (localStorage.getItem(id)) return;
  fn();
  localStorage.setItem(id, "true");
}

// New users see the features intro in September
export const isFeaturesIntroDue = () =>
  getCurrentUADate().getMonth() === 9 && !localStorage.getItem(SEEN_FEATURES_INTRO);

/** React.lazy that also loads in the background right after the page, so opening it doesn't wait for the network */
export function lazyPrefetched<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let loaded: ComponentType<P> | undefined;
  setTimeout(() => {
    load().then(
      (module) => {
        loaded = module.default;
      },
      () => {}
    );
  }, 500);
  const Lazy = lazy(load);
  // Lazy suspends on its first render even when loaded, and React holds back what suspended for 300ms
  return (props: P) => createElement(loaded ?? Lazy, props);
}
