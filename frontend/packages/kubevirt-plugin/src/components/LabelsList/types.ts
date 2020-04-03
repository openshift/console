import { IDEntity } from '../../types';

export type IDLabel = IDEntity & {
  key: string;
  value: string;
};
