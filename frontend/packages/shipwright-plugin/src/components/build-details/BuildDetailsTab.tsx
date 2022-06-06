import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
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
      <div className="co-m-pane__body">
        <SectionHeading text={t('shipwright-plugin~Build details')} />

        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={build} />
          </div>
          <div className="col-sm-6">
            <BuildSpecSection obj={build} buildSpec={build.spec} path="spec" />
          </div>
        </div>
      </div>

      {build.status ? (
        <div className="co-m-pane__body">
          <SectionHeading text={t('shipwright-plugin~Status')} />
          <BuildStatusSection obj={build} buildStatus={build.status} />
        </div>
      ) : null}
    </>
  );
};

export default BuildDetailsTab;
