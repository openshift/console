import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { SecretTypeAbstraction } from '@console/internal/components/secrets/create-secret';
import { ExpandCollapse } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { ResourceDropdownField } from '@console/shared/src';
import { secretModalLauncher } from '../../import/CreateSecretModal';

const AdvancedImageOptions: React.FC = () => {
  const { t } = useTranslation();
  const {
    setFieldValue,
    values: {
      formData: {
        project: { name: namespace },
      },
    },
  } = useFormikContext<FormikValues>();
  const filterData = (item) => {
    return (
      item.type === 'kubernetes.io/dockercfg' || item.type === 'kubernetes.io/dockerconfigjson'
    );
  };
  const handleSave = (name: string) => {
    setFieldValue('formData.imagePullSecret', name);
  };
  return (
    <ExpandCollapse
      textExpanded={t('devconsole~Hide advanced image options')}
      textCollapsed={t('devconsole~Show advanced image options')}
    >
      <ResourceDropdownField
        name="formData.imagePullSecret"
        label={t('devconsole~Pull Secret')}
        helpText={t(
          'devconsole~Secret for authentication when pulling image from a secured registry.',
        )}
        placeholder={t('devconsole~Select Secret name')}
        resources={[
          {
            isList: true,
            namespace,
            kind: SecretModel.kind,
            prop: 'secrets',
          },
        ]}
        resourceFilter={filterData}
        dataSelector={['metadata', 'name']}
        dataTest="secrets-dropdown"
        fullWidth
      />
      <Button
        className="pf-m-link--align-left"
        variant={ButtonVariant.link}
        onClick={() =>
          secretModalLauncher({
            namespace,
            save: handleSave,
            secretType: SecretTypeAbstraction.image,
          })
        }
      >
        {t('devconsole~Create new Secret')}
      </Button>
    </ExpandCollapse>
  );
};

export default AdvancedImageOptions;
