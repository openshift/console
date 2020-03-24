import { RowUIDMap } from './types';

export const getSelectedNodeUIDs = (rows: RowUIDMap) =>
  Object.keys(rows).filter((uid) => rows[uid].selected);
