import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation, withTranslation } from 'react-i18next';
import { WithT } from 'i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { K8sResourceKind } from '../../../module/k8s';
import { Firehose, LoadingBox, StatusBox } from '../../utils';
import { SecretTypeAbstraction } from './const';
import { toTypeAbstraction } from './utils';
import { SecretFormWrapper } from './SecretFormWrapper';

export const SecretLoadingWrapper = withTranslation()(
  class SecretLoadingWrapper extends React.Component<
    SecretLoadingWrapperProps & WithT,
    SecretLoadingWrapperState
  > {
    readonly state: SecretLoadingWrapperState = {
      secretTypeAbstraction: SecretTypeAbstraction.generic,
    };
    render() {
      const { obj, fixedKeys } = this.props;
      // Compute secretTypeAbstraction from loaded data, not from state
      const secretTypeAbstraction = !_.isEmpty(obj.data)
        ? toTypeAbstraction(obj.data)
        : SecretTypeAbstraction.generic;

      if (!secretTypeAbstraction) {
        return <LoadingBox />;
      }
      const fixed = fixedKeys?.reduce((acc, k) => ({ ...acc, [k]: obj.data?.[k] || '' }), {});

      return (
        <StatusBox {...obj}>
          <SecretFormWrapper
            {...this.props}
            secretTypeAbstraction={secretTypeAbstraction}
            obj={obj.data}
            fixed={fixed}
          />
        </StatusBox>
      );
    }
  },
);

export const EditSecret = ({ kind }: EditSecretProps) => {
  const params = useParams();
  const { t } = useTranslation();
  return (
    <Firehose
      resources={[{ kind, name: params.name, namespace: params.ns, isList: false, prop: 'obj' }]}
    >
      <SecretLoadingWrapper fixedKeys={['kind', 'metadata']} saveButtonText={t('public~Save')} />
    </Firehose>
  );
};

type EditSecretProps = {
  kind: string;
};

type SecretLoadingWrapperProps = {
  obj?: {
    data?: K8sResourceKind;
    [key: string]: any;
  };
  fixedKeys: string[];
  saveButtonText: string;
};

type SecretLoadingWrapperState = {
  secretTypeAbstraction: SecretTypeAbstraction;
};
