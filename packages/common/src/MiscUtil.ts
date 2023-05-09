export function getAppVersion() {
  return process.env.VITE_APP_VERSION ?? '0.0.1';
}

export function getTimeZone() {
  return 7;
}

export function randomInList<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}
