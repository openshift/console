import type { FC } from 'react';
import type { SimpleDropdownItem } from '@patternfly/react-templates';
import { SimpleDropdown } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';

type CreateActionDropdownProps = {
  namespace: string;
};

export const CreateActionDropdown: FC<CreateActionDropdownProps> = ({ namespace }) => {
  const { t } = useTranslation();

  const menuActions: SimpleDropdownItem[] = [
    {
      value: 'importFromGit',
      content: t('knative-plugin~Import from Git'),
      component: LinkTo(`/serverless-function/ns/${namespace || 'default'}`),
      // @ts-expect-error non-prop attribute is used for cypress
      'data-test-dropdown-menu': 'importFromGit',
    },
    {
      value: 'functionsUsingSamples',
      content: t('knative-plugin~Samples'),
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
      toggleContent={t('knative-plugin~Create function')}
      initialItems={menuActions}
    />
  );
};
