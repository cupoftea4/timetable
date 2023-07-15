export const LVIV_TIMEZONE = "Europe/Uzhgorod";

export const getCurrentUADate = () => {
    const offset = new Date().getTimezoneOffset() * 60000;
    const date = new Date(Date.now() + offset + getTimezoneOffset(LVIV_TIMEZONE));
    return date;
}

const getTimezoneOffset = (timeZone: string, date = new Date()) => {
    const tz = date.toLocaleString("en", { timeZone, timeStyle: "long" }).split(" ").slice(-1)[0];
    const utc = date.toUTCString();
    const dateString = utc.substring(0,utc.length - 4);
    const offset = Date.parse(`${dateString} UTC`) - Date.parse(`${dateString} ${tz}`);
    // return UTC offset in millis
    return offset;
}

export const stringToDate = (time: string) => {
    const date = getCurrentUADate();
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) return "Invalid time format";
    date.setHours(+hours);
    date.setMinutes(+minutes)
    date.setSeconds(0);
    return date;
}

export function getNULPWeek() {
    const date = getCurrentUADate();
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
        3 + (week1.getDay() + 6) % 7) / 7);
}