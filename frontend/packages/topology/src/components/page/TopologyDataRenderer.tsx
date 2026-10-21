import type { FC } from 'react';
import { useContext } from 'react';
import { observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { StatusBox } from '@console/internal/components/utils';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import type { ExtensibleModel } from '../../data-transforms/ModelContext';
import { ModelContext } from '../../data-transforms/ModelContext';
import { TopologyViewType } from '../../topology-types';
import { DroppableTopologyComponent } from './DroppableTopologyComponent';

interface TopologyDataRendererProps {
  viewType: TopologyViewType;
}

const TopologyDataRenderer: FC<TopologyDataRendererProps> = observer(function TopologyDataRenderer({
  viewType,
}) {
  const { t } = useTranslation();
  const { namespace, model, loaded, loadError } = useContext<ExtensibleModel>(ModelContext);

  return (
    <StatusBox
      skeleton={
        viewType === TopologyViewType.list && (
          <PaneBody className="skeleton-overview">
            <div className="skeleton-overview--head" />
            <div className="skeleton-overview--tile" />
            <div className="skeleton-overview--tile" />
            <div className="skeleton-overview--tile" />
          </PaneBody>
        )
      }
      data={model}
      label={t('topology~Topology')}
      loaded={loaded}
      loadError={loadError}
    >
      <DroppableTopologyComponent viewType={viewType} model={model} namespace={namespace} />
    </StatusBox>
  );
});

export default TopologyDataRenderer;
