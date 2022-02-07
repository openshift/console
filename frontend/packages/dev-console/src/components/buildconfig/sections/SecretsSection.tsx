import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { FirehoseResource } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
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

const SecretsSection: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();

  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);
  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: SecretModel.kind,
      prop: SecretModel.id,
      namespace,
    },
  ];

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
