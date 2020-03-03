/* eslint-disable lines-between-class-members */
import { getName, hasLabel, getLabels } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Wrapper } from './wrapper';

export class K8sResourceWrapper<RESOURCE extends K8sResourceKind> extends Wrapper<RESOURCE> {
  getName = () => getName(this.data);
  getLabels = (defaultValue = {}) => getLabels(this.data, defaultValue);
  hasLabel = (label: string) => hasLabel(this.data, label);
}
