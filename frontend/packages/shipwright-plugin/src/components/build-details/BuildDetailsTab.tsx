import type { FC } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import type { Build } from '../../types';
import BuildSpecSection from './BuildSpecSection';
import BuildStatusSection from './BuildStatusSection';

type BuildDetailsTabProps = {
  obj: Build;
};

const BuildDetailsTab: FC<BuildDetailsTabProps> = ({ obj: build }) => {
  const { t } = useTranslation();

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('shipwright-plugin~Build details')} />

        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={build} />
          </GridItem>
          <GridItem sm={6}>
            <BuildSpecSection obj={build} buildSpec={build.spec} path="spec" />
          </GridItem>
        </Grid>
      </PaneBody>

      {build.status ? (
        <PaneBody>
          <SectionHeading text={t('shipwright-plugin~Status')} />
          <BuildStatusSection obj={build} buildStatus={build.status} />
        </PaneBody>
      ) : null}
    </>
  );
};

export default BuildDetailsTab;
