import * as React from 'react';
import { Grid, GridItem, Title, Stack, StackItem } from '@patternfly/react-core';

import { getTemplateName } from '../../../selectors/vm-template/basic';
import { TemplateItem } from '../../../types/template';
import { BootSourceForm } from '../forms/boot-source-form';
import { BootSourceAction, BootSourceState } from '../forms/boot-source-form-reducer';

import './tab.scss';

type BootSourceProps = {
  template: TemplateItem;
  state: BootSourceState;
  dispatch: React.Dispatch<BootSourceAction>;
};

export const BootSource: React.FC<BootSourceProps> = ({ template, state, dispatch }) => (
  <Stack hasGutter className="kv-create-tab">
    <StackItem>
      <Title headingLevel="h5" size="lg">
        Boot source
      </Title>
      This template does not have a boot source. Provide a custom boot source for this{' '}
      <b>{getTemplateName(template?.variants[0])}</b> virtual machine.
    </StackItem>
    <StackItem>
      <Grid>
        <GridItem span={8}>
          <BootSourceForm state={state} dispatch={dispatch} />
        </GridItem>
      </Grid>
    </StackItem>
  </Stack>
);
