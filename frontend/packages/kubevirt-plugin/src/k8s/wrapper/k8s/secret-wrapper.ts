import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { SecretModel } from '../../../console-internal/models';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
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

  getData = () => {
    return this.uncheckedData().data;
  };

  getValue = (key: string, isBase64Encoded = true) => {
    const value = this.uncheckedData().data ? this.uncheckedData().data[key] : undefined;
    return isBase64Encoded ? atob(value) : value;
  };

  getFromJSONValue = (key: string, isBase64Encoded = true) =>
    JSON.parse(this.getValue(key, isBase64Encoded));

  setData = (data: object) => {
    this.uncheckedData().data = data;
    return this;
  };

  setValue = (key: string, value: string, isBase64Encoded = true) => {
    this.ensurePath('data');
    this.uncheckedData().data[key] = isBase64Encoded ? btoa(value) : value;
    return this;
  };

  setJSONValue = (key: string, value: object, isBase64Encoded = true) =>
    this.setValue(key, JSON.stringify(value), isBase64Encoded);
}
