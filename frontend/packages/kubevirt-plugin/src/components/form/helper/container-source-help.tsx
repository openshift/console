import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { isUpstream } from '../../../utils/common';
import { EXAMPLE_CONTAINER, FEDORA_EXAMPLE_CONTAINER } from '../../../utils/strings';

export const ContainerSourceHelp: React.FC = () => {
  const { t } = useTranslation();
  const container = isUpstream() ? FEDORA_EXAMPLE_CONTAINER : EXAMPLE_CONTAINER;

  return (
    <div className="pf-c-form__helper-text" aria-live="polite" data-test="ContainerSourceHelp">
      {t('kubevirt-plugin~Example: {{container}}', { container })}
    </div>
  );
};
