import * as React from 'react';
import { Alert, AlertVariant, FormGroup } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { Loading } from '@console/internal/components/utils';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin/src';
import { NetworkAttachmentDefinitionKind } from '@console/network-attachment-definition-plugin/src/types';
import { getName, getNamespace } from '@console/shared/src';
import { NetworkPolicy } from './network-policy-model';
import SelectMultiTypeahead from './SelectMultiTypeahead/SelectMultiTypeahead';

type NADsSelectorProps = {
  namespace: string;
  networkPolicy: NetworkPolicy;
  onPolicyChange: (policy: NetworkPolicy) => void;
};

const NetworkAttachmentDefinitionModelGroupVersionKind = getGroupVersionKindForModel(
  NetworkAttachmentDefinitionModel,
);

const NADsSelector: React.FC<NADsSelectorProps> = ({
  namespace,
  networkPolicy,
  onPolicyChange,
}) => {
  const { t } = useTranslation();

  const [nads, loaded, loadError] = useK8sWatchResource<NetworkAttachmentDefinitionKind[]>({
    groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
    isList: true,
    namespace,
  });

  const [nadsDefault, loadedDefaultNads, loadErrorDefaultNads] = useK8sWatchResource<
    NetworkAttachmentDefinitionKind[]
  >(
    namespace !== 'default'
      ? {
          groupVersionKind: NetworkAttachmentDefinitionModelGroupVersionKind,
          isList: true,
          namespace: 'default',
        }
      : null,
  );

  const nadsOptions = React.useMemo(() => {
    const allNads = [...(nads || []), ...(nadsDefault || [])];

    return allNads.map((nad) => ({
      value: `${getNamespace(nad)}/${getName(nad)}`,
    }));
  }, [nads, nadsDefault]);

  const onChange = (newNADs: string[]) => {
    onPolicyChange({ ...networkPolicy, policyFor: newNADs });
  };

  if (!loaded || !loadedDefaultNads) return <Loading />;

  if (loadError || loadErrorDefaultNads)
    return (
      <Alert title={t('Error')} variant={AlertVariant.danger}>
        {loadError}
      </Alert>
    );

  return (
    <FormGroup
      fieldId="multi-networkpolicy-policyfor"
      isRequired
      label={t('console-app~Policy for')}
    >
      <SelectMultiTypeahead
        options={nadsOptions}
        placeholder={t('console-app~Select one or more NetworkAttachmentDefinitions')}
        selected={networkPolicy.policyFor || []}
        setSelected={onChange}
      />
    </FormGroup>
  );
};

export default NADsSelector;
