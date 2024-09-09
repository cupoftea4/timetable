export const TIMETABLE_SCREEN_BREAKPOINT = 1000;
export const TABLET_SCREEN_BREAKPOINT = 768;
export const MOBILE_SCREEN_BREAKPOINT = 480;
export const NARROW_SCREEN_BREAKPOINT = 300;

export const TOAST_AUTO_CLOSE_TIME = 5000;

export const DEVELOP = import.meta.env.MODE === 'development';

export const ENABLE_SATURDAYS = import.meta.env.VITE_ENABLE_WORKING_SATURADAYS === 'true';

if (ENABLE_SATURDAYS && !import.meta.env.VITE_FIRST_CLASS_DATE) {
  throw new Error('VITE_FIRST_CLASS_DATE is required when ENABLE_WORKING_SATURADAYS is true');
}

export const FIRST_CLASS_DATE = new Date(import.meta.env.VITE_FIRST_CLASS_DATE);
