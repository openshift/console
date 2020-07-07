// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { getFlagsObject, flagPending } from '@console/internal/reducers/features';

export const usePerspectiveDetection = () => {
  const flags = useSelector((state: RootState) => getFlagsObject(state));
  const canGetNS = flags.CAN_GET_NS;
  const loadingFlag = flagPending(canGetNS);
  const enablePerspective = !canGetNS;

  return [enablePerspective, loadingFlag] as [boolean, boolean];
};
