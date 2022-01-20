import { FLAGS } from '../constants';
import { useFlag } from './flag';

export const usePrometheusGate = (): boolean => {
  const prometheusFlag = useFlag(FLAGS.PROMETHEUS);
  return (
    prometheusFlag &&
    !!window.SERVER_FLAGS.prometheusBaseURL &&
    !!window.SERVER_FLAGS.prometheusTenancyBaseURL
  );
};
