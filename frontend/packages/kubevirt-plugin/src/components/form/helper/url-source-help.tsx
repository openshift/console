import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  CENTOS_IMAGE_LINK,
  FEDORA_IMAGE_LINK,
  RHEL_IMAGE_LINK,
  WINDOWS_IMAGE_LINK,
} from '../../../utils/strings';

type URLSourceHelpProps = {
  baseImageName: string;
};

export const URLSourceHelp: React.FC<URLSourceHelpProps> = ({ baseImageName }) => {
  const { t } = useTranslation();
  // checking os is RHEL/Windows and adjust link images accordingly, Fedora is default for all other OS.
  const body = baseImageName?.includes('rhel') ? (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For RHEL, visit the{' '}
      <strong>
        <a href={RHEL_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
          RHEL download page
        </a>
      </strong>{' '}
      (requires login) and copy the download link URL of the KVM guest image
    </Trans>
  ) : baseImageName?.includes('win') ? (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For Windows, visit the{' '}
      <strong>
        <a href={WINDOWS_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
          Windows 10 cloud image
        </a>
      </strong>{' '}
      and copy the download link URL for the cloud base image
    </Trans>
  ) : baseImageName?.includes('centos') ? (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For Centos, visit the{' '}
      <strong>
        <a href={CENTOS_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
          Centos cloud image list
        </a>
      </strong>{' '}
      and copy the download link URL for the cloud base image
    </Trans>
  ) : (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For Fedora, visit the{' '}
      <strong>
        <a href={FEDORA_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
          Fedora cloud image list
        </a>
      </strong>{' '}
      and copy the download link URL for the cloud base image
    </Trans>
  );
  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      {body}
    </div>
  );
};
