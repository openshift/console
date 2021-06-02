import * as React from 'react';
import { Grid, GridItem, Stack, StackItem, Title } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useAccessReview2 } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel } from '@console/internal/models';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { TEMPLATE_BASE_IMAGE_NAME_PARAMETER } from '../../../constants/vm/constants';
import { getParameterValue } from '../../../selectors/selectors';
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
  const name = getTemplateName(template?.variants[0]);
  const baseImageName = getParameterValue(
    template?.variants[0],
    TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  );

  const [scAllowed, scAllowedLoading] = useAccessReview2({
    group: StorageClassModel.apiGroup,
    resource: StorageClassModel.plural,
    verb: 'list',
  });

  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>(
    scAllowed
      ? {
          kind: StorageClassModel.kind,
          isList: true,
          namespaced: false,
        }
      : null,
  );

  return (
    <Stack hasGutter className="kv-create-tab">
      <StackItem>
        <Title headingLevel="h5" size="lg">
          {t('kubevirt-plugin~Boot source')}
        </Title>
        <Trans t={t} ns="kubevirt-plugin" values={{ name }}>
          This template does not have a boot source. Provide a custom boot source for this{' '}
          <b>{{ name }}</b> virtual machine.
        </Trans>
      </StackItem>
      <StackItem>
        <Grid>
          <GridItem span={8}>
            <BootSourceForm
              state={state}
              dispatch={dispatch}
              storageClasses={storageClasses}
              storageClassesLoaded={scLoaded}
              scAllowed={scAllowed}
              scAllowedLoading={scAllowedLoading}
              baseImageName={baseImageName}
            />
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};
