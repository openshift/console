import {k8sBasePath} from './k8s/k8s';
import {coFetchJSON} from '../co-fetch';

export const k8sVersion = () => coFetchJSON(`${k8sBasePath}/version`);
