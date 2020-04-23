import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { Flex, FlexItem } from '@patternfly/react-core';
import {
  SidebarSectionHeading,
  ResourceLink,
  resourcePath,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '@console/dev-console/src/models';
import { TopologyOverviewItem } from '../../topology/topology-types';
import TriggerLastRunButton from './TriggerLastRunButton';
import PipelineRunItem from './PipelineRunItem';

const MAX_VISIBLE = 3;

type PipelinesOverviewProps = {
  item: TopologyOverviewItem;
};

const PipelinesOverview: React.FC<PipelinesOverviewProps> = ({
  item: {
    pipelines: [pipeline],
    pipelineRuns,
  },
}) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  return (
    <>
      <SidebarSectionHeading text={PipelineModel.labelPlural}>
        {pipelineRuns.length > MAX_VISIBLE && (
          <Link
            className="sidebar__section-view-all"
            to={`${resourcePath(referenceForModel(PipelineModel), name, namespace)}/Runs`}
          >
            {`View all (${pipelineRuns.length})`}
          </Link>
        )}
      </SidebarSectionHeading>
      <ul className="list-group">
        <li className="list-group-item pipeline-overview">
          <Flex breakpointMods={[{ modifier: 'justify-content-space-between' }] as any}>
            <FlexItem>
              <ResourceLink
                inline
                kind={referenceForModel(PipelineModel)}
                name={name}
                namespace={namespace}
              />
            </FlexItem>
            <FlexItem>
              <TriggerLastRunButton pipelineRuns={pipelineRuns} />
            </FlexItem>
          </Flex>
        </li>
        {_.take(pipelineRuns, MAX_VISIBLE).map((pr) => (
          <PipelineRunItem key={pr.metadata.uid} pipelineRun={pr} />
        ))}
      </ul>
    </>
  );
};

export default PipelinesOverview;
