import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { FEDORA_IMAGE_LINK, RHEL_IMAGE_LINK } from '../../../utils/strings';

export const URLSourceHelp: React.FC = () => {
  const { t } = useTranslation();
  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      {isUpstream ? (
        <Trans t={t} ns="kubevirt-plugin">
          Example: For Fedora, visit the{' '}
          <strong>
            <a href={FEDORA_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
              Fedora cloud image list
            </a>
          </strong>{' '}
          and copy the download link URL for the cloud base image
        </Trans>
      ) : (
        <Trans t={t} ns="kubevirt-plugin">
          Example: For RHEL, visit the{' '}
          <strong>
            <a href={RHEL_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
              RHEL download page
            </a>
          </strong>{' '}
          (requires login) and copy the download link URL of the KVM guest image
        </Trans>
      )}
    </div>
  );
};
