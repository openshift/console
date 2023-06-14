import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Page, navFactory, viewYamlComponent } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import {
  ActionMenu,
  ActionMenuVariant,
  ActionServiceProvider,
} from '@console/shared/src/components/actions';
import BuildDetailsTab from './BuildDetailsTab';
import BuildEventsTab from './BuildEventsTab';
import BuildRunsTab from './BuildRunsTab';

const BuildDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const customActionMenu = (_, build) => {
    const kindReference = referenceFor(build);
    const context = { [kindReference]: build };
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
    navFactory.details(BuildDetailsTab),
    navFactory.editYaml(viewYamlComponent),
    {
      href: 'buildruns',
      // t('shipwright-plugin~BuildRuns')
      nameKey: 'shipwright-plugin~BuildRuns',
      component: BuildRunsTab,
    },
    navFactory.events(BuildEventsTab),
  ];

  return <DetailsPage {...props} customActionMenu={customActionMenu} pages={pages} />;
};

export default BuildDetailsPage;
