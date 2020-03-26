import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

type TopologyHelmReleaseNotesPanelProps = {
  releaseNotes: string;
};

const TopologyHelmReleaseNotesPanel: React.SFC<TopologyHelmReleaseNotesPanelProps> = ({
  releaseNotes,
}) => (
  <div className="overview__sidebar-pane-body">
    {releaseNotes && <SyncMarkdownView content={releaseNotes} />}
  </div>
);

export default TopologyHelmReleaseNotesPanel;
