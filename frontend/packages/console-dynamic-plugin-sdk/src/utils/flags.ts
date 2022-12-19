// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { FeatureSubStore, FlagsObject } from '../app/features';

export type UseFlag = (flag: string) => boolean;
export type UseAllFlags = () => FlagsObject;

/**
 * Hook that returns the given feature flag from FLAGS redux state.
 * @param flag The feature flag to return
 * @returns the boolean value of the requested feature flag or undefined
 */
export const useFlag: UseFlag = (flag) =>
  useSelector<FeatureSubStore, boolean>(({ FLAGS }) => FLAGS.get(flag));

/**
 * Hook that returns the entire feature flags as a JS object.
 * @returns all feature flags state as a JS object
 */
export const useAllFlags: UseAllFlags = () =>
  useSelector<FeatureSubStore, FlagsObject>((store: FeatureSubStore) => store.FLAGS.toJS());
