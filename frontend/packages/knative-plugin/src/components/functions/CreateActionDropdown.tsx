import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { history, Dropdown } from '@console/internal/components/utils';
import { MenuAction, MenuActions, useActiveNamespace } from '@console/shared/src';

export const CreateActionDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();

  const menuActions: MenuActions = {
    importfromGit: {
      label: t('knative-plugin~Import from Git'),
      onSelection: () => `/serverless-function/ns/${activeNamespace}`,
    },
    functionsUsingSamples: {
      label: t('knative-plugin~Samples'),
      onSelection: () => `/samples/ns/${activeNamespace}?sampleType=Serverless function`,
    },
  };

  const items = menuActions
    ? Object.keys(menuActions).reduce<Record<string, string>>((acc, key) => {
        const menuAction: MenuAction = menuActions[key];
        const { label } = menuAction;
        if (!label) return acc;

        return {
          ...acc,
          [key]: label,
        };
      }, {})
    : undefined;

  const onSelectCreateAction = (actionName: string): void => {
    const selectedMenuItem: MenuAction = menuActions[actionName];
    let url: string;
    if (selectedMenuItem.onSelection) {
      url = selectedMenuItem.onSelection(actionName, selectedMenuItem, url);
    }
    if (url) {
      history.push(url);
    }
  };

  return (
    <Dropdown
      buttonClassName="pf-m-primary"
      menuClassName="pf-m-align-right-on-md"
      title={t('knative-plugin~Create function')}
      noSelection
      items={items}
      onChange={onSelectCreateAction}
      className=""
    />
  );
};
