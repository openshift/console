import type { FC } from 'react';
import { useMemo } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { InputField, MultiColumnField, ResourceDropdownField } from '@console/shared';
import FormSection from '../../import/section/FormSection';

export type SecretsSectionFormData = {
  formData: {
    secrets: {
      secret: string;
      mountPoint: string;
    }[];
  };
};

const SecretsSection: FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();

  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);

  const watchedResources = useK8sWatchResources<{ secrets: SecretKind[] }>({
    secrets: {
      isList: true,
      kind: referenceForModel(SecretModel),
      namespace,
    },
  });

  const resources = useMemo(
    () => [
      {
        data: watchedResources.secrets.data,
        loaded: watchedResources.secrets.loaded,
        loadError: watchedResources.secrets.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets.data,
      watchedResources.secrets.loaded,
      watchedResources.secrets.loadError,
    ],
  );

  const mountPointLabel = t('devconsole~Mount point');

  return (
    <FormSection title={t('devconsole~Secrets')} dataTest="section secrets">
      <MultiColumnField
        name="formData.secrets"
        addLabel={t('devconsole~Add secret')}
        headers={[t('devconsole~Secret'), mountPointLabel]}
        emptyValues={{}}
      >
        <ResourceDropdownField
          name="secret"
          resources={resources}
          dataSelector={['metadata', 'name']}
          placeholder={t('devconsole~Select a secret')}
          autocompleteFilter={autocompleteFilter}
          fullWidth
          showBadge
        />
        <InputField name="mountPoint" type={TextInputTypes.text} aria-label={mountPointLabel} />
      </MultiColumnField>
    </FormSection>
  );
};

export default SecretsSection;
