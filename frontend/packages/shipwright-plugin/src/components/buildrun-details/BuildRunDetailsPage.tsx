import type { FC } from 'react';
import type { DetailsPageProps } from '@console/internal/components/factory';
import { DetailsPage } from '@console/internal/components/factory';
import type { Page } from '@console/internal/components/utils';
import { navFactory } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
} from '@console/shared/src/components/actions';
import { useShipwrightBreadcrumbsFor } from '../../utils';
import { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';
import BuildRunDetailsTab from './BuildRunDetailsTab';
import BuildRunEventsTab from './BuildRunEventsTab';
import BuildRunLogsTab from './BuildRunLogsTab';

const BuildRunDetailsPage: FC<DetailsPageProps> = (props) => {
  const customActionMenu = (_, buildRun) => {
    const kindReference = referenceFor(buildRun);
    const context = { [kindReference]: buildRun };
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

  const pages: Page[] = [
    navFactory.details(BuildRunDetailsTab),
    navFactory.editYaml(),
    navFactory.logs(BuildRunLogsTab),
    navFactory.events(BuildRunEventsTab),
  ];

  return (
    <DetailsPage
      {...props}
      getResourceStatus={getBuildRunStatus}
      customActionMenu={customActionMenu}
      pages={pages}
      breadcrumbsFor={useShipwrightBreadcrumbsFor}
    />
  );
};

export default BuildRunDetailsPage;
