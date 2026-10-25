import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { getReleaseNotesLink } from '../../module/k8s';

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
