import type { FC } from 'react';
import { FormGroup } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { ContainerModel } from '@console/internal/models';

const ContainerField: FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { containers },
    },
  } = useFormikContext<FormikValues>();
  const containerName = containers[0]?.name;
  return (
    <FormGroup fieldId="container-name">
      <span style={{ fontWeight: 'bold', position: 'relative' }}>
        <Trans t={t} ns="devconsole">
          Container: <ResourceIcon kind={ContainerModel.kind} />
          {{ containerName }}
        </Trans>
      </span>
    </FormGroup>
  );
};

export default ContainerField;
