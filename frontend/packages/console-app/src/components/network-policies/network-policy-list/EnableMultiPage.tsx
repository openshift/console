import * as React from 'react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateFooter,
  EmptyStateHeader,
  Tooltip,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { K8sResourceCommon, K8sVerb, useAccessReview } from '@console/dynamic-plugin-sdk';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { Loading } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { MultiNetworkPolicyModel } from '@console/internal/models';
import { multiNetworkPolicyRef, NetworkConfigModel } from './constants';
import { useLastNamespacePath } from './useLastNamespacePath';

const EnableMultiPage: React.FC = () => {
  const { t } = useTranslation();
  const lastNamespacePath = useLastNamespacePath();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const [networkClusterConfig, loaded] = useK8sWatchResource<K8sResourceCommon & { spec: any }>({
    groupVersionKind: {
      group: NetworkConfigModel.apiGroup,
      version: NetworkConfigModel.apiVersion,
      kind: NetworkConfigModel.kind,
    },
    name: 'cluster',
  });

  const [canPatchConfig] = useAccessReview({
    group: NetworkConfigModel.apiGroup,
    resource: NetworkConfigModel.plural,
    verb: 'patch' as K8sVerb,
  });

  const enableMultiNetworkPolicy = () => {
    setLoading(true);
    return k8sPatchResource({
      data: [
        {
          op: 'replace',
          path: '/spec/disableMultiNetwork',
          value: false,
        },
        {
          op: 'replace',
          path: '/spec/useMultiNetworkPolicy',
          value: true,
        },
      ],
      model: NetworkConfigModel,
      resource: networkClusterConfig,
    }).then(() => navigate(`/k8s/${lastNamespacePath}/${multiNetworkPolicyRef}`));
  };

  if (loading)
    return (
      <Bullseye>
        <Loading />
      </Bullseye>
    );

  const EnableButton = (
    <Button isDisabled={!loaded || !canPatchConfig} onClick={enableMultiNetworkPolicy}>
      {t('console-app~Enable {{kind}}', { kind: MultiNetworkPolicyModel.labelPlural })}
    </Button>
  );

  return (
    <EmptyState>
      <EmptyStateHeader
        headingLevel="h4"
        titleText={t('console-app~{{kind}} disabled', {
          kind: MultiNetworkPolicyModel.labelPlural,
        })}
      />
      <EmptyStateFooter>
        <EmptyStateActions>
          {canPatchConfig ? (
            EnableButton
          ) : (
            <Tooltip
              content={t(
                'console-app~Cluster administrator permissions are required to enable this feature.',
              )}
            >
              <span>{EnableButton}</span>
            </Tooltip>
          )}
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};

export default EnableMultiPage;
