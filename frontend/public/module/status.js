import {analyticsSvc} from './analytics';
import {k8sBasePath} from './k8s/k8s';
import {coFetchJSON} from '../co-fetch';

export const k8sVersion = () => coFetchJSON(`${k8sBasePath}/version`);

export const tectonicVersion = () => coFetchJSON('version').then(resp => {
  // TODO (stuart): update what we do here
  // analyticsSvc.push({tier: resp.tier});
  analyticsSvc.push({tier: 'tectonic'});
  return resp;
});
