import { useURLPoll } from '../utils/url-poll-hook';
import { getPrometheusURL, PrometheusEndpoint } from './helpers';
import { PrometheusRulesResponse } from '../monitoring/types';

export const usePrometheusRulesPoll = ({ delay, namespace }: PrometheusPollProps) => {
  const url = getPrometheusURL({
    endpoint: PrometheusEndpoint.RULES,
    namespace,
  });

  return useURLPoll<PrometheusRulesResponse>(url, delay, namespace);
};

type PrometheusPollProps = {
  delay?: number;
  namespace?: string;
};
