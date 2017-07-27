import { coFetchJSON } from '../../co-fetch';

export const getFedClusters = (MULTI_CLUSTER) => {
  const token = MULTI_CLUSTER && _.get(MULTI_CLUSTER, 'federation-apiserver-token');
  const fedApiUrl = MULTI_CLUSTER && _.get(MULTI_CLUSTER, 'federation-apiserver-url');
  const opts = {
    headers: {
      'X-Tectonic-Federation-token': token,
      'X-Tectonic-Federation-Url': fedApiUrl,
    }
  };
  return coFetchJSON('/api/federation/apis/federation/v1beta1/clusters', 'GET', opts);
};

export const clusterUtil = {
  getFedClusters,
};
