import { K8sResourceCommon } from '@console/internal/module/k8s';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { SecretModel } from '@console/internal/models';
import { K8sInitAddon } from '../common/util/k8s-mixin';

export class SecretWrappper extends K8sResourceWrapper<K8sResourceCommon, SecretWrappper> {
  constructor(secret?: K8sResourceCommon | SecretWrappper | any, copy = false) {
    super(SecretModel, secret, copy);
  }

  init(data: K8sInitAddon & { type?: string } = {}) {
    super.init(data);
    if (data.type || !this.uncheckedData().type) {
      this.setType(data.type || 'Opaque');
    }

    return this;
  }

  setType = (type: string) => {
    this.uncheckedData().type = type;
    return this;
  };

  getValue = (key: string, isBase64Encoded = false) => {
    const value = this.uncheckedData().data ? this.uncheckedData().data[key] : undefined;
    return isBase64Encoded ? atob(value) : value;
  };

  getFromJSONValue = (key: string, isBase64Encoded = false) =>
    JSON.parse(this.getValue(key, isBase64Encoded));

  setData = (data: object) => {
    this.uncheckedData().data = data;
    return this;
  };

  setValue = (key: string, value: string, isBase64Encoded = false) => {
    this.ensurePath('data');
    this.uncheckedData().data[key] = isBase64Encoded ? btoa(value) : value;
    return this;
  };

  setJSONValue = (key: string, value: object, isBase64Encoded = false) =>
    this.setValue(key, JSON.stringify(value), isBase64Encoded);
}
