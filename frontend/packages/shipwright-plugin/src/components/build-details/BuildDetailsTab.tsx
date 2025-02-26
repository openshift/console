import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Build } from '../../types';
import BuildSpecSection from './BuildSpecSection';
import BuildStatusSection from './BuildStatusSection';

type BuildDetailsTabProps = {
  obj: Build;
};

const BuildDetailsTab: React.FC<BuildDetailsTabProps> = ({ obj: build }) => {
  const { t } = useTranslation();

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('shipwright-plugin~Build details')} />

        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={build} />
          </div>
          <div className="col-sm-6">
            <BuildSpecSection obj={build} buildSpec={build.spec} path="spec" />
          </div>
        </div>
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
