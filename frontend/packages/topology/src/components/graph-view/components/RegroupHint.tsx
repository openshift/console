import type { FC } from 'react';
import { RhUiInformationFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Shortcut } from '@console/shared/src/components/shortcuts/Shortcut';
import { ShortcutTable } from '@console/shared/src/components/shortcuts/ShortcutTable';

import './RegroupHint.scss';

const RegroupHint: FC = () => {
  const { t } = useTranslation();
  return (
    <div className="odc-regroup-hint">
      <RhUiInformationFillIcon className="odc-regroup-hint__icon" />
      <span className="odc-regroup-hint__text">
        <ShortcutTable>
          <Shortcut shift drag>
            {t('topology~Edit application grouping')}
          </Shortcut>
        </ShortcutTable>
      </span>
    </div>
  );
};

export default RegroupHint;
