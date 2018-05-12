/* eslint-disable no-unused-vars */

import { K8sResourceKind } from './index';

export const getQN: (obj: K8sResourceKind) => string = ({metadata: {name, namespace}}) => (namespace ? `(${namespace})-` : '') + name;

export const k8sBasePath = `${(window as any).SERVER_FLAGS.basePath}api/kubernetes`;
