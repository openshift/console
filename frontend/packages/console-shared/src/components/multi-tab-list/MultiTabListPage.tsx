import type { ReactNode, FC } from 'react';
import { ActionListItem, Button } from '@patternfly/react-core';
import { SimpleDropdown } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom-v5-compat';
import type { Page } from '@console/internal/components/utils/horizontal-nav';
import { HorizontalNav } from '@console/internal/components/utils/horizontal-nav';
import { referenceForModel } from '@console/internal/module/k8s';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { PageTitleContext } from '../pagetitle/PageTitleContext';
import type { MenuActions, MenuAction, SecondaryButtonAction } from './multi-tab-list-page-types';

interface MultiTabListPageProps {
  title: string;
  badge?: ReactNode;
  menuActions?: MenuActions;
  pages: Page[];
  secondaryButtonAction?: SecondaryButtonAction;
  telemetryPrefix?: string;
}

const MultiTabListPage: FC<MultiTabListPageProps> = ({
  title,
  badge,
  pages,
  menuActions,
  secondaryButtonAction,
  telemetryPrefix,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ns } = useParams();
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
      navigate(url);
    }
  };

  const items = menuActions
    ? Object.keys(menuActions).reduce<Record<string, string>>((acc, key) => {
        const menuAction: MenuAction = menuActions[key];
        const label =
          menuAction.label ||
          (menuAction.model?.labelKey ? t(menuAction.model.labelKey) : menuAction.model?.label);
        if (!label) return acc;

        return {
          ...acc,
          [key]: label,
        };
      }, {})
    : undefined;

  const titleProviderValues = {
    telemetryPrefix,
    titlePrefix: title,
  };

  return (
    <PageTitleContext.Provider value={titleProviderValues}>
      <PageHeading
        title={title}
        badge={badge}
        primaryAction={
          <>
            {secondaryButtonAction && (
              <ActionListItem>
                <Button
                  type="button"
                  variant="secondary"
                  data-test="secondary-action"
                  component={(props) => <Link {...props} to={secondaryButtonAction.href} />}
                >
                  {secondaryButtonAction.label}
                </Button>
              </ActionListItem>
            )}
            {items && (
              <ActionListItem>
                <SimpleDropdown
                  toggleProps={{
                    variant: 'primary',
                    // @ts-expect-error non-prop attribute is used for cypress
                    'data-test': 'tab-list-page-create',
                  }}
                  toggleContent={t('console-shared~Create')}
                  initialItems={Object.keys(items).map((item) => ({
                    value: item,
                    content: items[item],
                    'data-test-dropdown-menu': item,
                  }))}
                  onSelect={(_e, value: string) => {
                    onSelectCreateAction(value);
                  }}
                />
              </ActionListItem>
            )}
          </>
        }
      />
      <HorizontalNav pages={pages} noStatusBox />
    </PageTitleContext.Provider>
  );
};

export default MultiTabListPage;
