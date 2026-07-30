import { FLAGS } from '../constants/common';
import { useFlag } from './useFlag';

export const usePrometheusGate = (): boolean => {
  const prometheusFlag = useFlag(FLAGS.PROMETHEUS);
  return (
    prometheusFlag &&
    !!window.SERVER_FLAGS.prometheusBaseURL &&
    !!window.SERVER_FLAGS.prometheusTenancyBaseURL
  );
};
