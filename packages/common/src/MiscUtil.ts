export function getAppVersion() {
  return process.env.VITE_APP_VERSION ?? '0.0.1';
}

export function getTimeZone() {
  return 7;
}

export function randomInList<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export function getDateWithoutTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getToday() {
  return getDateWithoutTime(new Date());
}

export const ONE_DAY_DURATION = 86400000;

export function getNextDay(date: Date) {
  const dateWithoutTime = getDateWithoutTime(date);
  return new Date(dateWithoutTime.getTime() + ONE_DAY_DURATION);
}

export function getPrevDay(date: Date) {
  const dateWithoutTime = getDateWithoutTime(date);
  return new Date(dateWithoutTime.getTime() - ONE_DAY_DURATION);
}
