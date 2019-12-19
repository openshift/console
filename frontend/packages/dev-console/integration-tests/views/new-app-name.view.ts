export const newApplicationName = function(): string {
  const d = new Date();
  const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : `${d.getMonth() + 1}`;
  const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
  const hour = d.getHours() < 10 ? `0${d.getHours()}` : `${d.getHours()}`;
  const minute = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
  const randomNumber = Math.round(Math.random() * 10000);
  const appName = `testapp-${month}${day}-${hour}${minute}-${randomNumber}`;
  return appName;
};

export const newApplicationShortName = function(): string {
  const randomNumber = Math.round(Math.random() * 10000);
  const appName = `testapp-${randomNumber}`;
  return appName;
};

export const newAppName = function(): string {
  const d = new Date();
  const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : `${d.getMonth() + 1}`;
  const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
  const hour = d.getHours() < 10 ? `0${d.getHours()}` : `${d.getHours()}`;
  const minute = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
  const randomNumber = Math.round(Math.random() * 10000);
  const nodeName = `app-${month}${day}-${hour}${minute}-${randomNumber}`;
  return nodeName;
};

export const newAppShortName = function(): string {
  const randomNumber = Math.round(Math.random() * 10000);
  const nodeName = `app-${randomNumber}`;
  return nodeName;
};
