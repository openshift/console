import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
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

export const BootSource: React.FC<BootSourceProps> = ({ template, state, dispatch }) => {
  const { t } = useTranslation();
  return (
    <Stack hasGutter className="kv-create-tab">
      <StackItem>
        <Title headingLevel="h5" size="lg">
          {t('kubevirt-plugin~Boot source')}
        </Title>
        <Trans t={t} ns="kubevirt-plugin">
          This template does not have a boot source. Provide a custom boot source for this{' '}
          <b>{getTemplateName(template?.variants[0])}</b> virtual machine.
        </Trans>
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
};
