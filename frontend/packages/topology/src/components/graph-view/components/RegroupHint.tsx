import type { FC } from 'react';
import ShortcutGrid from '@patternfly/react-component-groups/dist/dynamic/ShortcutGrid';
import { useTranslation } from 'react-i18next';

const RegroupHint: FC = () => {
  const { t } = useTranslation('topology');
  return (
    <ShortcutGrid
      shortcuts={[
        {
          keys: ['shift'],
          drag: true,
          description: t('Edit application grouping'),
        },
      ]}
    />
  );
};

export default RegroupHint;
