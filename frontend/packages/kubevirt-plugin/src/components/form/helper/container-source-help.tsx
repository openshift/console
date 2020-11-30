import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { EXAMPLE_CONTAINER } from '../../../utils/strings';

export const ContainerSourceHelp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      {t('kubevirt-plugin~Example: {{container}}', { container: EXAMPLE_CONTAINER })}
    </div>
  );
};
