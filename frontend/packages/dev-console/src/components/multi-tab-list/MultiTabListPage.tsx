import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import {
  history,
  PageHeading,
  HorizontalNav,
  Page,
  ActionsMenu,
} from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import './MultiTabListPage.scss';

interface MultiTabListPageProps {
  title: React.ReactNode;
  badge?: React.ReactNode;
  menuActions?: any;
  pages: Page[];
  match: Rmatch<any>;
}

const MultiTabListPage: React.FC<MultiTabListPageProps> = ({
  title,
  badge,
  pages,
  menuActions,
  match,
}) => {
  const handleNamespaceChange = (newNamespace: string): void => {
    if (newNamespace === ALL_NAMESPACES_KEY) {
      history.push('/pipelines/all-namespaces');
    } else {
      history.push('/pipelines/ns/:ns');
    }
  };
  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      onNamespaceChange={handleNamespaceChange}
    >
      <PageHeading
        title={title}
        badge={badge}
        menuActions={menuActions}
        style={{ display: 'flex', alignItems: 'flex-start' }}
      >
        <ActionsMenu
          actions={menuActions}
          title="Create"
          actionsMenuClass="actions-menu"
          toggleButtonClass="toggle-button"
        />
      </PageHeading>
      <HorizontalNav pages={pages} match={match} noStatusBox />
    </NamespacedPage>
  );
};

export default MultiTabListPage;
