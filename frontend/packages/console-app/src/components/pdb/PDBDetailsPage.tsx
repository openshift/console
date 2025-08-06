import * as React from 'react';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DetailsPage } from '@console/internal/components/factory';
import {
  Kebab,
  ResourceSummary,
  SectionHeading,
  navFactory,
  DetailsItem,
} from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PodDisruptionBudgetModel } from '../../models';
import { PodDisruptionBudgetKind } from './types';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(PodDisruptionBudgetModel), ...common];

const PodDisruptionBudgetDetails: React.FC<PodDisruptionBudgetDetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('console-app~PodDisruptionBudget details')} />
      <Grid hasGutter>
        <GridItem sm={6}>
          <ResourceSummary resource={obj} showPodSelector />
        </GridItem>
        <GridItem sm={6}>
          <DescriptionList>
            <DetailsItem
              label={
                !_.isNil(obj.spec.minAvailable)
                  ? t('console-app~Min available')
                  : t('console-app~Max unavailable')
              }
              obj={obj}
              path={!_.isNil(obj.spec.minAvailable) ? 'spec.minAvailable' : 'spec.maxUnavailable'}
            >
              {!_.isNil(obj.spec.minAvailable) ? obj.spec.minAvailable : obj.spec.maxUnavailable}
            </DetailsItem>
            <DetailsItem
              label={t('console-app~Allowed disruption')}
              obj={obj}
              path="status.disruptionsAllowed"
            >
              {obj.status.disruptionsAllowed}
            </DetailsItem>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};

export const PodDisruptionBudgetDetailsPage: React.FC<PodDisruptionBudgetDetailsPageProps> = (
  props,
) => (
  <DetailsPage
    {...props}
    kind={props.kind}
    menuActions={menuActions}
    pages={[
      navFactory.details(PodDisruptionBudgetDetails),
      navFactory.editYaml(),
      navFactory.pods(),
    ]}
  />
);

export type PodDisruptionBudgetDetailsPageProps = {
  match: any;
  kind: string;
};
export type PodDisruptionBudgetDetailsProps = {
  obj: PodDisruptionBudgetKind;
};
