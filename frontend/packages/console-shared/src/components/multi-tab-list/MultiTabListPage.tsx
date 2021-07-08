import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Rmatch } from 'react-router-dom';
import {
  history,
  PageHeading,
  HorizontalNav,
  Page,
  Dropdown,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
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
  const { t } = useTranslation();
  const {
    params: { ns },
  } = match;
  const onSelectCreateAction = (actionName: string): void => {
    const selectedMenuItem: MenuAction = menuActions[actionName];
    let url: string;
    if (selectedMenuItem.model) {
      const namespace = ns ?? 'default';
      const modelRef = referenceForModel(selectedMenuItem.model);
      url = namespace ? `/k8s/ns/${namespace}/${modelRef}/~new` : `/k8s/cluster/${modelRef}/~new`;
    }
    if (selectedMenuItem.onSelection) {
      url = selectedMenuItem.onSelection(actionName, selectedMenuItem, url);
    }
    if (url) {
      history.push(url);
    }
  };

  const items = Object.keys(menuActions).reduce((acc, key) => {
    const menuAction: MenuAction = menuActions[key];
    const label =
      menuAction.label ||
      (menuAction.model?.labelKey ? t(menuAction.model.labelKey) : menuAction.model?.label);
    if (!label) return acc;

    return {
      ...acc,
      [key]: label,
    };
  }, {});

  return (
    <>
      <PageHeading className="co-m-nav-title--row" title={title} badge={badge}>
        <Dropdown
          buttonClassName="pf-m-primary"
          menuClassName="pf-m-align-right-on-md"
          title={t('console-shared~Create')}
          noSelection
          items={items}
          onChange={onSelectCreateAction}
        />
      </PageHeading>
      <HorizontalNav pages={pages} match={match} noStatusBox />
    </>
  );
};

export default MultiTabListPage;
