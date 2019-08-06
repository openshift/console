import { info } from 'console';

export const newApplicationName = function(): string {
  const d = new Date();
  const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : `${d.getMonth() + 1}`;
  const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
  const hour = d.getHours() < 10 ? `0${d.getHours()}` : `${d.getHours()}`;
  const minute = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
  const randomNumber = Math.round(Math.random() * 10000);
  const appName: string = `testapp-${month}${day}-${hour}${minute}-${randomNumber}`;
  info('New application name', appName);
  return appName;
};

export const newAppName = function(): string {
  const d = new Date();
  const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : `${d.getMonth() + 1}`;
  const day = d.getDate() < 10 ? `0${d.getDate()}` : `${d.getDate()}`;
  const hour = d.getHours() < 10 ? `0${d.getHours()}` : `${d.getHours()}`;
  const minute = d.getMinutes() < 10 ? `0${d.getMinutes()}` : `${d.getMinutes()}`;
  const randomNumber = Math.round(Math.random() * 10000);
  const nodeName: string = `app-${month}${day}-${hour}${minute}-${randomNumber}`;
  info('New app name', nodeName);
  return nodeName;
};
