const LVIV_TIMEZONE = "Europe/Uzhgorod";

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
    date.setHours(+hours);
    date.setMinutes(+minutes)
    date.setSeconds(0);
    return date;
}
