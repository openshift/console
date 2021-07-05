// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const useFlag: UseFlag = (flag) =>
  useSelector<RootState, boolean>(({ FLAGS }) => FLAGS.get(flag));

type UseFlag = (flag: string) => boolean;
