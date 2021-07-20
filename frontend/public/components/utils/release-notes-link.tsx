import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { getReleaseNotesLink } from '../../module/k8s';
import { ExternalLink } from '../utils';

export const ReleaseNotesLink: React.FC<ReleaseNotesLinkProps> = ({ version }) => {
  const releaseNotesLink = getReleaseNotesLink(version);
  const { t } = useTranslation();
  return (
    releaseNotesLink && (
      <ExternalLink text={t('public~View release notes')} href={releaseNotesLink} />
    )
  );
};

type ReleaseNotesLinkProps = {
  version: string;
};
