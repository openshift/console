import * as React from 'react';
import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import { SecretData } from '@console/internal/components/configmap-and-secret-data';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import { isBound } from '../../utils';

export const GetSecret: React.FC<GetSecretProps> = ({ obj }) => {
  const secretData = {
    BUCKET_NAME: Base64.encode(getName(obj)),
    ACCESS_KEY: Base64.encode('loading..'),
    SECRET_KEY: Base64.encode('loading..'),
    ENDPOINT: Base64.encode('http://loading.com'),
  };
  if (isBound(obj)) {
    const secret = k8sGet(SecretModel, getName(obj), getNamespace(obj));
    const configMap = k8sGet(ConfigMapModel, getName(obj), getNamespace(obj));
    Promise.all([secret, configMap])
      .then((data) => {
        secretData.ACCESS_KEY = Base64.encode(_.get(data[0], 'data.AWS_ACCESS_KEY_ID'));
        secretData.SECRET_KEY = Base64.encode(_.get(data[0], 'data.AWS_SECRET_ACCESS_KEY'));
        const endpoint = `${_.get(data[1], 'data.BUCKET_HOST')}:${_.get(
          data[1],
          'data.BUCKET_PORT',
        )}`;
        secretData.ENDPOINT = Base64.encode(endpoint);
      })
      .catch(() => undefined);
    return (
      <div className="co-m-pane__body">
        <SecretData title="Object Bucket Claim Data" data={secretData} />
      </div>
    );
  }

  return null;
};

type GetSecretProps = {
  obj: K8sResourceKind;
};
