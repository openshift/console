export const API_SERVERS_UP = '(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100';
export const CONTROLLER_MANAGERS_UP =
  '(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100';
export const SCHEDULERS_UP = '(sum(up{job="scheduler"} == 1) / count(up{job="scheduler"})) * 100';
export const API_SERVER_REQUESTS_SUCCESS =
  'sum(rate(apiserver_request_count{code=~"2.."}[5m])) / sum(rate(apiserver_request_count[5m])) * 100';
