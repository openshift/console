import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from '@patternfly/react-topology';
import { HintBlock, StatusBox } from '@console/internal/components/utils';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { TopologyView } from './TopologyView';
import EmptyState from '../EmptyState';

interface TopologyDataRendererProps {
  showGraphView: boolean;
  title: string;
}

export const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = observer(
  ({ showGraphView, title }) => {
    const { t } = useTranslation();
    const { namespace, model, loaded, loadError } = React.useContext<ExtensibleModel>(ModelContext);
    const EmptyMsg = React.useCallback(
      () => (
        <EmptyState
          title={title}
          hintBlock={
            <HintBlock title={t('devconsole~No resources found')}>
              <p>
                {t(
                  'devconsole~To add content to your project, create an application, component or service using one of these options.',
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
          !showGraphView && (
            <div className="co-m-pane__body skeleton-overview">
              <div className="skeleton-overview--head" />
              <div className="skeleton-overview--tile" />
              <div className="skeleton-overview--tile" />
              <div className="skeleton-overview--tile" />
            </div>
          )
        }
        data={model ? model.nodes : null}
        label={t('devconsole~Topology')}
        loaded={loaded}
        loadError={loadError}
        EmptyMsg={EmptyMsg}
      >
        <TopologyView showGraphView={showGraphView} model={model} namespace={namespace} />
      </StatusBox>
    );
  },
);
