import * as React from 'react';
import { SimpleDropdown } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { MenuAction, MenuActions } from '@console/shared/src';

type CreateActionDropdownProps = {
  namespace: string;
};

export const CreateActionDropdown: React.FC<CreateActionDropdownProps> = ({ namespace }) => {
  const { t } = useTranslation();

  const menuActions: MenuActions = {
    importfromGit: {
      label: t('knative-plugin~Import from Git'),
      onSelection: () => `/serverless-function/ns/${namespace || 'default'}`,
    },
    functionsUsingSamples: {
      label: t('knative-plugin~Samples'),
      onSelection: () => `/samples/ns/${namespace || 'default'}?sampleType=Serverless function`,
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
    <SimpleDropdown
      toggleProps={{
        variant: 'primary',
      }}
      toggleContent={t('knative-plugin~Create function')}
      initialItems={Object.keys(items).map((item) => ({
        value: item,
        content: items[item],
        'data-test-dropdown-menu': item,
      }))}
      onSelect={(_e, value: string) => onSelectCreateAction(value)}
    />
  );
};
