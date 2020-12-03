import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from '@patternfly/react-topology';
import { HintBlock, StatusBox } from '@console/internal/components/utils';
import EmptyState from '@console/dev-console/src/components/EmptyState';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import TopologyView from './TopologyView';
import { TopologyViewType } from '../../topology-types';
import { FilterProvider } from '../../filters/FilterProvider';

interface TopologyDataRendererProps {
  viewType: TopologyViewType;
  title: string;
}

const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = observer(
  ({ viewType, title }) => {
    const { t } = useTranslation();
    const { namespace, model, loaded, loadError } = React.useContext<ExtensibleModel>(ModelContext);
    const EmptyMsg = React.useCallback(
      () => (
        <EmptyState
          title={title}
          hintBlock={
            <HintBlock title={t('topology~No resources found')}>
              <p>
                {t(
                  'topology~To add content to your Project, create an Application, component or service using one of these options.',
                )}
              </p>
            </HintBlock>
          }
        />
      ),
      [t, title],
    );

    return (
      <StatusBox
        skeleton={
          viewType === TopologyViewType.list && (
            <div className="co-m-pane__body skeleton-overview">
              <div className="skeleton-overview--head" />
              <div className="skeleton-overview--tile" />
              <div className="skeleton-overview--tile" />
              <div className="skeleton-overview--tile" />
            </div>
          )
        }
        data={model ? model.nodes : null}
        label={t('topology~Topology')}
        loaded={loaded}
        loadError={loadError}
        EmptyMsg={EmptyMsg}
      >
        <FilterProvider>
          <TopologyView viewType={viewType} model={model} namespace={namespace} />
        </FilterProvider>
      </StatusBox>
    );
  },
);

export default TopologyDataRenderer;
