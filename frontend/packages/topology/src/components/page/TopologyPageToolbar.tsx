import * as React from 'react';
import { Tooltip, Popover, Button } from '@patternfly/react-core';
import { ListIcon, TopologyIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import {
  FileUploadContext,
  FileUploadContextType,
} from '@console/app/src/components/file-upload/file-upload-context';
import { allImportResourceAccess } from '@console/dev-console/src/actions/add-resources';
import { useAddToProjectAccess } from '@console/dev-console/src/utils/useAddToProjectAccess';
import { useIsMobile } from '@console/shared';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import { TopologyViewType } from '../../topology-types';
import { getTopologyShortcuts } from '../graph-view/TopologyShortcuts';

interface TopologyPageToolbarProps {
  viewType: TopologyViewType;
  onViewChange: (view: TopologyViewType) => void;
}

const TopologyPageToolbar: React.FC<TopologyPageToolbarProps> = observer(
  ({ viewType, onViewChange }) => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { extensions } = React.useContext<FileUploadContextType>(FileUploadContext);
    const showGraphView = viewType === TopologyViewType.graph;
    const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
    const { namespace, isEmptyModel } = dataModelContext;
    const createResourceAccess: string[] = useAddToProjectAccess(namespace);
    const allImportAccess = createResourceAccess.includes(allImportResourceAccess);
    const viewChangeTooltipContent = showGraphView
      ? t('topology~List view')
      : t('topology~Graph view');

    if (!namespace) {
      return null;
    }

    return (
      <>
        {!isMobile ? (
          <Popover
            aria-label={t('topology~Shortcuts')}
            bodyContent={getTopologyShortcuts(t, {
              supportedFileTypes: extensions,
              isEmptyModel,
              viewType,
              allImportAccess,
            })}
            position="left"
            maxWidth="100vw"
          >
            <Button
              type="button"
              variant="link"
              className="odc-topology__shortcuts-button"
              icon={<QuestionCircleIcon />}
              data-test-id="topology-view-shortcuts"
            >
              {t('topology~View shortcuts')}
            </Button>
          </Popover>
        ) : null}
        <Tooltip position="left" content={viewChangeTooltipContent}>
          <Button
            variant="link"
            aria-label={viewChangeTooltipContent}
            className="pf-m-plain odc-topology__view-switcher"
            data-test-id="topology-switcher-view"
            isDisabled={isEmptyModel}
            onClick={() =>
              onViewChange(showGraphView ? TopologyViewType.list : TopologyViewType.graph)
            }
          >
            {showGraphView ? <ListIcon size="md" /> : <TopologyIcon size="md" />}
          </Button>
        </Tooltip>
      </>
    );
  },
);

export default TopologyPageToolbar;
