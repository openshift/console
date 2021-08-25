import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { FirehoseResource } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import {
  DropdownField,
  MultiColumnField,
  ResourceDropdownField,
  CheckboxField,
} from '@console/shared';
import FormSection from '../../import/section/FormSection';
import { ImageOptionType } from './ImagesSection';

export type TriggersSectionFormData = {
  formData: {
    triggers: {
      configChange: boolean;
      imageChange: boolean;
      otherTriggers: {
        type: string;
        secret: string;
      }[];
    };
  };
};

const TriggersSection: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const [{ value: buildFromType }] = useField<ImageOptionType>('formData.images.buildFrom.type');

  // Keys must match the triggers type
  const typeItems: Record<string, string> = {
    Generic: t('devconsole~Generic'),
    GitHub: t('devconsole~GitHub'),
    GitLab: t('devconsole~GitLab'),
    Bitbucket: t('devconsole~BitBucket'),
  };

  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);
  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: SecretModel.kind,
      prop: SecretModel.id,
      namespace,
    },
  ];

  return (
    <FormSection title={t('devconsole~Triggers')} dataTest="section triggers">
      <FormGroup fieldId="configChange" label={t('devconsole~Config change')}>
        <CheckboxField
          name="formData.triggers.configChange"
          label={t('devconsole~Automatically build a new image when config changes')}
          data-test="config-change checkbox"
        />
      </FormGroup>

      {buildFromType !== 'none' ? (
        <FormGroup fieldId="imageChange" label={t('devconsole~Image change')}>
          <CheckboxField
            name="formData.triggers.imageChange"
            label={t('devconsole~Automatically build a new image when image changes')}
            data-test="image-change checkbox"
          />
        </FormGroup>
      ) : null}

      <MultiColumnField
        name="formData.triggers.otherTriggers"
        addLabel={t('devconsole~Add trigger')}
        headers={[t('devconsole~Type'), t('devconsole~Secret')]}
        emptyValues={{ type: 'generic' }}
      >
        <DropdownField name="type" title={t('devconsole~Select')} items={typeItems} fullWidth />
        <ResourceDropdownField
          name="secret"
          resources={resources}
          dataSelector={['metadata', 'name']}
          placeholder={t('devconsole~Select a secret')}
          autocompleteFilter={autocompleteFilter}
          fullWidth
          showBadge
        />
      </MultiColumnField>
    </FormSection>
  );
};

export default TriggersSection;
