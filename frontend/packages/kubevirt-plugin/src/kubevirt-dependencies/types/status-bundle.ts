import { StatusEnum } from '../constants/status-enum';

export interface StatusBundle<STATUS extends StatusEnum<any>> {
  status: STATUS;
  message?: string;
  detailedMessage?: string;
  progress?: number;
}
