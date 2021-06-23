// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { getFlagsObject, flagPending } from '@console/internal/reducers/features';
import { RootState } from '@console/internal/redux';
import { MCH_AVAILABILITY_FLAG } from '../features';

const useMCHDetection = () => {
  const flags = useSelector((state: RootState) => getFlagsObject(state));
  const isMCHAvailable = flags[MCH_AVAILABILITY_FLAG];
  const loadingFlag = flagPending(isMCHAvailable);
  return [isMCHAvailable, loadingFlag] as [boolean, boolean];
};

export default useMCHDetection;
