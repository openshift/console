import * as React from 'react';

import { FEDORA_IMAGE_LINK, RHEL_IMAGE_LINK } from '../../../utils/strings';

export const URLSourceHelp: React.FC = () => {
  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  return (
    <div className="pf-c-form__helper-text" aria-live="polite">
      Example: For {isUpstream ? 'Fedora' : 'RHEL'}, visit the{' '}
      <a
        href={isUpstream ? FEDORA_IMAGE_LINK : RHEL_IMAGE_LINK}
        rel="noopener noreferrer"
        target="_blank"
      >
        <strong>{isUpstream ? 'Fedora cloud image list' : 'RHEL download page'}</strong>
      </a>{' '}
      {isUpstream
        ? 'and copy the download link URL for the cloud base image'
        : '(requires login) and copy the download link URL of the KVM guest image'}
    </div>
  );
};
