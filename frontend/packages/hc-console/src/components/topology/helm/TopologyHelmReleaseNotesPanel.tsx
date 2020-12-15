import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import HelmReleaseNotesEmptyState from '../../helm/details/notes/HelmReleaseNotesEmptyState';

type TopologyHelmReleaseNotesPanelProps = {
  releaseNotes: string;
};

const TopologyHelmReleaseNotesPanel: React.SFC<TopologyHelmReleaseNotesPanelProps> = ({
  releaseNotes,
}) =>
  releaseNotes ? (
    <div className="overview__sidebar-pane-body">
      <SyncMarkdownView content={releaseNotes} />
    </div>
  ) : (
    <HelmReleaseNotesEmptyState />
  );

export default TopologyHelmReleaseNotesPanel;
