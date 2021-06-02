import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';

const ContainerField: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { containers },
    },
  } = useFormikContext<FormikValues>();
  const containerName = containers[0]?.name;
  return (
    <FormGroup fieldId="container-name">
      <span style={{ fontWeight: 'bold' }}>
        <Trans t={t} ns="devconsole">
          Container: <ResourceIcon kind={ContainerModel.kind} />
          {{ containerName }}
        </Trans>
      </span>
    </FormGroup>
  );
};

export default ContainerField;
