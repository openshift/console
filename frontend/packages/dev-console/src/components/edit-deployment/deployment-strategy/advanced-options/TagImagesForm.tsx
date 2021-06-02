import * as React from 'react';
import { FormSection } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { DropdownField } from '@console/shared/src';
import ImageStream from '../../../import/image-search/ImageStream';
import { getContainerNames } from '../../utils/edit-deployment-utils';

const TagImagesForm: React.FC<{ lifecycleHook: string }> = ({ lifecycleHook }) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { containers, deploymentStrategy },
    },
  } = useFormikContext<FormikValues>();
  const dropdownItems = getContainerNames(containers);
  return (
    <FormSection>
      <DropdownField
        name={`formData.deploymentStrategy.imageStreamData.${lifecycleHook}.containerName`}
        label={t('devconsole~Container name')}
        items={dropdownItems}
        selectedKey={deploymentStrategy.imageStreamData[lifecycleHook].containerName}
        fullWidth
        required
      />
      <ImageStream
        label={t('devconsole~Tag as')}
        formContextField={`formData.deploymentStrategy.imageStreamData.${lifecycleHook}`}
        required
      />
    </FormSection>
  );
};

export default TagImagesForm;
