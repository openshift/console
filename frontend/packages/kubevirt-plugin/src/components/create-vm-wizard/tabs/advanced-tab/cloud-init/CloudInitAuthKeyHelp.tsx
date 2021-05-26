import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ExternalLink } from '@console/internal/components/utils';

const CloudInitAuthKeyHelp: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      <Trans t={t} ns="kubevirt-plugin">
        Authorized keys must follow the SSH Public key format,
        <ExternalLink
          additionalClassName="kubevirt-create-vm-modal__cloud-init-help-link"
          text={t('kubevirt-plugin~Learn more')}
          href={'https://www.redhat.com/sysadmin/configure-ssh-keygen'}
        />
      </Trans>
    </div>
  );
};

export default CloudInitAuthKeyHelp;
