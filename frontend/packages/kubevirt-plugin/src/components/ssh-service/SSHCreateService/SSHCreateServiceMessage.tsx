import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { NODE_PORTS_LINK } from '../../../utils/strings';

const SSHCreateServiceMessage = () => {
  const { t } = useTranslation();
  return (
    <div>
      {t(
        'kubevirt-plugin~SSH access is using a node port. Node port requires additional port resources.',
      )}
      <div>
        <ExternalLink text={t('kubevirt-plugin~Learn more')} href={NODE_PORTS_LINK} />
      </div>
    </div>
  );
};

export default SSHCreateServiceMessage;
