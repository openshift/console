import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretFormType } from './types';
import { toSecretFormType } from './utils';
import { SecretFormWrapper } from './SecretFormWrapper';

export const SecretLoadingWrapper = withTranslation()(
  class SecretLoadingWrapper extends React.Component<
    SecretLoadingWrapperProps & WithT,
    SecretLoadingWrapperState
  > {
    readonly state: SecretLoadingWrapperState = {
      secretTypeAbstraction: SecretTypeAbstraction.generic,
    };
    componentDidUpdate() {
      if (!_.isEmpty(this.props.obj?.data)) {
        const secretTypeAbstraction = toTypeAbstraction(this.props.obj?.data);
        if (this.state.secretTypeAbstraction !== secretTypeAbstraction) {
          this.setState({
            secretTypeAbstraction,
          });
        }
      }
    }
    render() {
      const { obj, fixedKeys } = this.props;
      const { secretTypeAbstraction } = this.state;
      if (!secretTypeAbstraction) {
        return <LoadingBox />;
      }
      const fixed = fixedKeys?.reduce((acc, k) => ({ ...acc, [k]: obj?.data?.[k] || '' }), {});

      return (
        <StatusBox {...obj}>
          <SecretFormWrapper
            {...this.props}
            secretTypeAbstraction={secretTypeAbstraction}
            obj={obj?.data}
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
    <StatusBox loaded={secretLoaded} data={secret} loadError={secretError}>
      <SecretFormWrapper
        formType={formType}
        obj={secret}
        saveButtonText={t('public~Save')}
        fixed={fixedData}
      />
    </StatusBox>
  );
};

type EditSecretProps = {
  kind: string;
};
