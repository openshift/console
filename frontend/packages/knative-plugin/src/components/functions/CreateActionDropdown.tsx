import type { FC } from 'react';
import type { SimpleDropdownItem } from '@patternfly/react-templates';
import { SimpleDropdown } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';

type CreateActionDropdownProps = {
  namespace: string;
};

export const CreateActionDropdown: FC<CreateActionDropdownProps> = ({ namespace }) => {
  const { t } = useTranslation('knative-plugin');

  const menuActions: SimpleDropdownItem[] = [
    {
      value: 'importFromGit',
      content: t('Import from Git'),
      component: LinkTo(`/serverless-function/ns/${namespace || 'default'}`),
      // @ts-expect-error non-prop attribute is used for cypress
      'data-test-dropdown-menu': 'importFromGit',
    },
    {
      value: 'functionsUsingSamples',
      content: t('Samples'),
      component: LinkTo(`/samples/ns/${namespace || 'default'}?sampleType=Serverless function`),
      // @ts-expect-error non-prop attribute is used for cypress
      'data-test-dropdown-menu': 'functionsUsingSamples',
    },
  ];

  return (
    <SimpleDropdown
      toggleProps={{
        variant: 'primary',
        // @ts-expect-error non-prop attribute is used for cypress
        'data-test': 'create-action-dropdown',
      }}
      toggleContent={t('Create function')}
      initialItems={menuActions}
    />
  );
};
