// Behaves like moment.js's fromNow
export const fromNow = dateTime => {
  const now = new Date();
  dateTime = new Date(dateTime);
  const secondsAgo = (now.getTime() - dateTime.getTime()) / 1000;
  const minutesAgo = secondsAgo / 60;
  const hoursAgo = minutesAgo / 60;
  const daysAgo = hoursAgo / 24;

  if (daysAgo > 548) {
    return `${Math.round(daysAgo / 365)} years ago`;
  }
  if (daysAgo > 320) {
    return 'a year ago';
  }
  if (daysAgo > 45) {
    return `${Math.round(daysAgo / 30)} months ago`;
  }
  if (daysAgo > 26) {
    return 'a month ago';
  }
  if (hoursAgo > 36) {
    return `${Math.round(daysAgo)} days ago`;
  }
  if (hoursAgo > 22) {
    return 'a day ago';
  }
  if (minutesAgo > 90) {
    return `${Math.round(hoursAgo)} hours ago`;
  }
  if (minutesAgo > 45) {
    return 'an hour ago';
  }
  if (secondsAgo > 90) {
    return `${Math.round(minutesAgo)} minutes ago`;
  }
  if (secondsAgo > 45) {
    return 'a minute ago';
  }
  if (secondsAgo > 15) {
    return 'less than a minute ago';
  }

  if (secondsAgo >= 0) {
    return 'a few seconds ago';
  }

  if (secondsAgo > -45) {
    return 'a few seconds from now';
  }
  if (secondsAgo > -90) {
    return 'a minute from now';
  }
  if (minutesAgo > -45) {
    return `${-Math.round(minutesAgo)} minutes from now`;
  }
  if (minutesAgo > -90) {
    return 'an hour from now';
  }
  if (hoursAgo > -22) {
    return `${-Math.round(hoursAgo)} hours from now`;
  }
  if (hoursAgo > -36) {
    return 'a day from now';
  }
  if (daysAgo > -26) {
    return `${-Math.round(daysAgo)} days from now`;
  }
  if (daysAgo > -45) {
    return 'a month from now';
  }
  if (daysAgo > -320) {
    return `${-Math.round(daysAgo / 30)} months from now`;
  }
  if (daysAgo > -580) {
    return 'a year from now';
  }
  return `${-Math.round(daysAgo / 365)} years from now`;
};

export const isValid = (dateTime: Date) => dateTime instanceof Date && !Number.isNaN(dateTime.valueOf());
