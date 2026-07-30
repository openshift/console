import type { FC } from 'react';
import { useMemo } from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useField } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { SecretKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { CheckboxField } from '@console/shared/src/components/formik-fields/CheckboxField';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { MultiColumnField } from '@console/shared/src/components/formik-fields/multi-column-field/MultiColumnField';
import { ResourceDropdownField } from '@console/shared/src/components/formik-fields/ResourceDropdownField';
import FormSection from '../../import/section/FormSection';
import type { ImageOptionType } from './ImagesSection';

export type TriggersSectionFormData = {
  formData: {
    triggers: {
      configChange: boolean;
      imageChange: boolean;
      otherTriggers: {
        type: string;
        secret: string;
        allowEnv?: boolean;
        data?: { [key: string]: any };
      }[];
    };
  };
};

const TriggersSection: FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation('devconsole');
  const [{ value: buildFromType }] = useField<ImageOptionType>('formData.images.buildFrom.type');

  // Keys must match the triggers type
  const typeItems: Record<string, string> = {
    Generic: t('Generic'),
    GitHub: t('GitHub'),
    GitLab: t('GitLab'),
    Bitbucket: t('BitBucket'),
  };

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

  return (
    <FormSection title={t('Triggers')} dataTest="section triggers">
      <FormGroup fieldId="configChange" label={t('Config change')}>
        <CheckboxField
          name="formData.triggers.configChange"
          label={t('Automatically build a new image when config changes')}
          data-test="config-change checkbox"
        />
      </FormGroup>

      {buildFromType !== 'none' ? (
        <FormGroup fieldId="imageChange" label={t('Image change')}>
          <CheckboxField
            name="formData.triggers.imageChange"
            label={t('Automatically build a new image when image changes')}
            data-test="image-change checkbox"
          />
        </FormGroup>
      ) : null}

      <MultiColumnField
        name="formData.triggers.otherTriggers"
        addLabel={t('Add trigger')}
        headers={[t('Type'), t('Secret')]}
        emptyValues={{ type: 'generic' }}
      >
        <DropdownField name="type" title={t('Select')} items={typeItems} fullWidth />
        <ResourceDropdownField
          name="secret"
          resources={resources}
          dataSelector={['metadata', 'name']}
          placeholder={t('Select a secret')}
          autocompleteFilter={autocompleteFilter}
          fullWidth
          showBadge
        />
      </MultiColumnField>
    </FormSection>
  );
};

export default TriggersSection;
