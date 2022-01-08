import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  CENTOS_IMAGE_LINK,
  FEDORA_IMAGE_LINK,
  RHEL_IMAGE_LINK,
  WINDOWS_IMAGE_LINKS,
} from '../../../utils/strings';

type URLSourceHelpProps = {
  baseImageName: string;
  templateName?: string;
};

export const URLSourceHelp: React.FC<URLSourceHelpProps> = ({ baseImageName, templateName }) => {
  const { t } = useTranslation();
  const windowsTemplateName = templateName?.replace(/ VM/g, '') || 'Microsoft Windows 10';
  // checking os is RHEL/Windows and adjust link images accordingly, Fedora is default for all other OS.
  const body = baseImageName?.includes('rhel') ? (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For RHEL, visit the{' '}
      <strong>
        <a href={RHEL_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
          RHEL download page
        </a>
      </strong>{' '}
      (requires login) and copy the download link URL of the KVM guest image (expires quickly)
    </Trans>
  ) : baseImageName?.includes('win') ? (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For Windows, get a link to the{' '}
      <strong>
        <a
          href={WINDOWS_IMAGE_LINKS[baseImageName] || WINDOWS_IMAGE_LINKS.win10}
          rel="noopener noreferrer"
          target="_blank"
        >
          installation iso of {windowsTemplateName}
        </a>
      </strong>{' '}
      and copy the download link URL
    </Trans>
  ) : baseImageName?.includes('centos') ? (
    <Trans t={t} ns="kubevirt-plugin">
      Example: For CentOS, visit the{' '}
      <strong>
        <a href={CENTOS_IMAGE_LINK} rel="noopener noreferrer" target="_blank">
          CentOS cloud image list
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
