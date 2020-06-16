import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import * as _ from 'lodash';
import {
  history,
  PageHeading,
  HorizontalNav,
  Page,
  Dropdown,
} from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { MenuActions, MenuAction } from './multi-tab-list-page-types';

interface MultiTabListPageProps {
  title: string;
  badge?: React.ReactNode;
  menuActions?: MenuActions;
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
  const {
    params: { ns },
  } = match;
  const multiTabListPageTitle = (
    <span style={{ display: 'flex', alignItems: 'flex-end' }}>
      {title}
      <span style={{ marginLeft: 'var(--pf-global--spacer--md)' }}>{badge}</span>
    </span>
  );
  const handleNamespaceChange = (newNamespace: string): void => {
    if (newNamespace === ALL_NAMESPACES_KEY) {
      history.push('/pipelines/all-namespaces');
    } else {
      history.push('/pipelines/ns/:ns');
    }
  };
  const onSelectCreateAction = (actionName: string): void => {
    const selectedMenuItem: MenuAction = menuActions[actionName];
    const namespace = selectedMenuItem.model.namespaced ? ns || 'default' : ns;
    const modelRef = referenceForModel(selectedMenuItem.model);
    let url = namespace ? `/k8s/ns/${namespace}/${modelRef}/~new` : `/k8s/cluster/${modelRef}/~new`;
    if (selectedMenuItem.onSelection) {
      url = selectedMenuItem.onSelection(actionName, selectedMenuItem, url);
    }
    if (url) {
      history.push(url);
    }
  };

  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      hideApplications
      onNamespaceChange={handleNamespaceChange}
    >
      <PageHeading title={multiTabListPageTitle} className="co-m-nav-title--row">
        <div className="co-m-primary-action">
          <Dropdown
            buttonClassName="pf-m-primary"
            menuClassName="pf-m-align-right-on-md"
            title="Create"
            noSelection
            items={_.mapValues(
              menuActions,
              (menuAction: MenuAction) => menuAction.label || menuAction.model.label,
            )}
            onChange={onSelectCreateAction}
          />
        </div>
      </PageHeading>
      <HorizontalNav pages={pages} match={match} noStatusBox />
    </NamespacedPage>
  );
};

export default MultiTabListPage;
