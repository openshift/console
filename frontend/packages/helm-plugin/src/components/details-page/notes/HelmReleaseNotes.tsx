import type { FC } from 'react';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { MarkdownView } from '@console/shared/src/components/markdown/MarkdownView';
import type { HelmRelease } from '../../../types/helm-types';
import HelmReleaseNotesEmptyState from './HelmReleaseNotesEmptyState';

export interface HelmReleaseNotesProps {
  customData: HelmRelease;
}

const HelmReleaseNotes: FC<HelmReleaseNotesProps> = ({ customData }) => {
  const helmReleaseNotes = customData?.info?.notes ?? '';
  return helmReleaseNotes ? (
    <PaneBody>
      <MarkdownView content={helmReleaseNotes} />
    </PaneBody>
  ) : (
    <HelmReleaseNotesEmptyState />
  );
};

export default HelmReleaseNotes;
