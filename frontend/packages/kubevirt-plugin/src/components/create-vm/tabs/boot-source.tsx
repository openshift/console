import * as React from 'react';
import { Grid, GridItem, Title, Stack, StackItem } from '@patternfly/react-core';
import { StatusBox } from '@console/internal/components/utils';

import { getTemplateName } from '../../../selectors/vm-template/basic';
import { TemplateItem } from '../../../types/template';
import { BootSourceForm } from '../forms/boot-source-form';
import { BootSourceAction, BootSourceState } from '../forms/boot-source-form-reducer';
import { CustomizeLinkProps, CustomizeLink } from '../forms/create-vm-form';

import './tab.scss';

type BootSourceProps = CustomizeLinkProps & {
  template: TemplateItem;
  templates: TemplateItem[];
  state: BootSourceState;
  dispatch: React.Dispatch<BootSourceAction>;
  loaded: boolean;
  loadError: any;
};

export const BootSource: React.FC<BootSourceProps> = ({
  template,
  templates,
  state,
  dispatch,
  onCustomize,
  loaded,
  loadError,
}) => (
  <StatusBox data={templates} loaded={loaded} loadError={loadError} label="Resources">
    <Stack hasGutter className="kv-create-tab">
      <StackItem>
        <Title headingLevel="h5" size="lg">
          Boot source
        </Title>
        <Stack>
          <StackItem>
            This template does not have a boot source. Provide a custom boot source for this{' '}
            <b>{getTemplateName(template?.variants[0])}</b> virtual machine.
          </StackItem>
          <StackItem>
            <CustomizeLink onCustomize={onCustomize} />
          </StackItem>
        </Stack>
      </StackItem>
      <StackItem>
        <Grid>
          <GridItem span={8}>
            <BootSourceForm state={state} dispatch={dispatch} />
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  </StatusBox>
);
