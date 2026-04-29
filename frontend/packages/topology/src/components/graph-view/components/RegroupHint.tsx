import type { FC } from 'react';
import ShortcutGrid from '@patternfly/react-component-groups/dist/dynamic/ShortcutGrid';
import { useTranslation } from 'react-i18next';

const RegroupHint: FC = () => {
  const { t } = useTranslation();
  return (
    <ShortcutGrid
      shortcuts={[
        {
          keys: ['shift'],
          drag: true,
          description: t('topology~Edit application grouping'),
        },
      ]}
    />
  );
};

export default RegroupHint;
