import * as React from 'react';
import { Grid, GridItem, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CreateVMForm, CreateVMFormProps } from '../forms/create-vm-form';

import './tab.scss';

export const ReviewAndCreate: React.FC<CreateVMFormProps> = (props) => {
  const { t } = useTranslation();
  return (
    <div className="kv-create-tab">
      <Title headingLevel="h5" size="lg">
        {t('kubevirt-plugin~Review and create')}
      </Title>
      <Grid>
        <GridItem span={8}>
          <CreateVMForm {...props} />
        </GridItem>
      </Grid>
    </div>
  );
};
