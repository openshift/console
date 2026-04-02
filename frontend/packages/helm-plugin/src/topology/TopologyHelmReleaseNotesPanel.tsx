import type { FC } from 'react';
import { MarkdownView } from '@console/shared/src/components/markdown/MarkdownView';
import HelmReleaseNotesEmptyState from '../components/details-page/notes/HelmReleaseNotesEmptyState';

type TopologyHelmReleaseNotesPanelProps = {
  releaseNotes: string;
};

const TopologyHelmReleaseNotesPanel: FC<TopologyHelmReleaseNotesPanelProps> = ({ releaseNotes }) =>
  releaseNotes ? (
    <div className="overview__sidebar-pane-body">
      <MarkdownView content={releaseNotes} />
    </div>
  ) : (
    <HelmReleaseNotesEmptyState />
  );

export default TopologyHelmReleaseNotesPanel;
