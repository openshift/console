import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { navFactory, ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import { referenceForModel, VolumeGroupSnapshotClassKind } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';

const { editYaml, events } = navFactory;

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <div className="pf-v6-u-m-lg">
      <SectionHeading text={t('console-app~VolumeGroupSnapshotClass details')} />
      <div className="row">
        <div className="col-md-6 col-xs-12">
          <ResourceSummary resource={obj}>
            <dt>{t('console-app~Driver')}</dt>
            <dd>{obj?.driver}</dd>
            <dt>{t('console-app~Deletion policy')}</dt>
            <dd>{obj?.deletionPolicy}</dd>
          </ResourceSummary>
        </div>
      </div>
    </div>
  );
};

const VolumeGroupSnapshotClassDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const pages = [
    {
      href: '',
      // t('console-app~Details')
      nameKey: 'console-app~Details',
      component: Details,
    },
    editYaml(),
    events(ResourceEventStream),
  ];

  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };

  return <DetailsPage {...props} customActionMenu={customActionMenu} pages={pages} />;
};

type DetailsProps = {
  obj: VolumeGroupSnapshotClassKind;
};

export default VolumeGroupSnapshotClassDetailsPage;
