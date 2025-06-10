import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { HelmRelease } from '../../../types/helm-types';
import HelmReleaseNotesEmptyState from './HelmReleaseNotesEmptyState';

export interface HelmReleaseNotesProps {
  customData: HelmRelease;
}

const HelmReleaseNotes: React.FC<HelmReleaseNotesProps> = ({ customData }) => {
  const helmReleaseNotes = customData?.info?.notes ?? '';
  return helmReleaseNotes ? (
    <PaneBody>
      <SyncMarkdownView content={helmReleaseNotes} />
    </PaneBody>
  ) : (
    <HelmReleaseNotesEmptyState />
  );
};

export default HelmReleaseNotes;
