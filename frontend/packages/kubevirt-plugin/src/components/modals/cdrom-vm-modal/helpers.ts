import { CD } from './types';

export const getAvailableCDName = (cds: CD[]) => {
  const cdSet = new Set(cds.map((cd) => cd.name));
  let index = 1;
  while (cdSet.has(`cd-drive-${index}`)) {
    index++;
  }
  return `cd-drive-${index}`;
};
