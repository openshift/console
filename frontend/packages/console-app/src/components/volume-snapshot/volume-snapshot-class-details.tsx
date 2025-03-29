import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceEventStream } from '@console/internal/components/events';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { SectionHeading, ResourceSummary, navFactory } from '@console/internal/components/utils';
import { referenceForModel, VolumeSnapshotClassKind } from '@console/internal/module/k8s';
import { ActionMenu, ActionMenuVariant, ActionServiceProvider } from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

const { editYaml, events } = navFactory;

const Details: React.FC<DetailsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <PaneBody>
      <SectionHeading text={t('console-app~VolumeSnapshotClass details')} />
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
    </PaneBody>
  );
};

const VolumeSnapshotClassDetailsPage: React.FC<DetailsPageProps> = (props) => {
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
  obj: VolumeSnapshotClassKind;
};

export default VolumeSnapshotClassDetailsPage;
