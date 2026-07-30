import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { k8sBasePath } from './k8s/k8s';

export const k8sVersion = () => coFetchJSON(`${k8sBasePath}/version`);
