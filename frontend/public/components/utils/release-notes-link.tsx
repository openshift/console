import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { getReleaseNotesLink } from '../../module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

export const ReleaseNotesLink: FC<ReleaseNotesLinkProps> = ({ version }) => {
  const releaseNotesLink = getReleaseNotesLink(version);
  const { t } = useTranslation('public');
  return (
    releaseNotesLink && <ExternalLink text={t('View release notes')} href={releaseNotesLink} />
  );
};

type ReleaseNotesLinkProps = {
  version: string;
};
