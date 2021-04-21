import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';
import { FormGroup } from '@patternfly/react-core';

const ContainerField: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { containers },
    },
  } = useFormikContext<FormikValues>();
  return (
    <FormGroup fieldId="container-name">
      <span style={{ fontWeight: 'bold' }}>
        {t('devconsole~Container:')}&nbsp; <ResourceIcon kind={ContainerModel.kind} />
        {containers[0]?.name}
      </span>
    </FormGroup>
  );
};

export default ContainerField;
