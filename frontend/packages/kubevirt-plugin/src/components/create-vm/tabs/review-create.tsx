import * as React from 'react';
import { Grid, GridItem, Title } from '@patternfly/react-core';

import { CreateVMFormProps, CreateVMForm } from '../forms/create-vm-form';

import './tab.scss';

export const ReviewAndCreate: React.FC<CreateVMFormProps> = (props) => (
  <div className="kv-create-tab">
    <Title headingLevel="h5" size="lg">
      Review and create
    </Title>
    <Grid>
      <GridItem span={8}>
        <CreateVMForm {...props} />
      </GridItem>
    </Grid>
  </div>
);
