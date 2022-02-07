import { useSelector } from 'react-redux';
import { FeatureSubStore } from '../app/features';

export type UseFlag = (flag: string) => boolean;

export const useFlag: UseFlag = (flag) =>
  useSelector<FeatureSubStore, boolean>(({ FLAGS }) => FLAGS.get(flag));
