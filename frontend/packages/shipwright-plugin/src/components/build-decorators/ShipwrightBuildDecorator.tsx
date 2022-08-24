import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { impersonateStateToProps } from '@console/dynamic-plugin-sdk';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { BuildDecoratorBubble } from '@console/topology/src/components/graph-view';
import { BUILDRUN_TO_RESOURCE_MAP_LABEL } from '../../const';
import { BuildRunModel } from '../../models';
import { Build, BuildRun } from '../../types';
import { getLatestBuildRunStatusforDeployment } from '../../utils';

type BuildRunDecoratorProps = {
  buildRuns: BuildRun[];
  build: Build[];
  resource: K8sResourceKind;
  radius: number;
  x: number;
  y: number;
};

type StateProps = {
  impersonate?: {
    kind: string;
    name: string;
    subprotocols: string[];
  };
};

export const ConnectedBuildRunDecorator: React.FC<BuildRunDecoratorProps & StateProps> = ({
  buildRuns,
  resource,
  radius,
  x,
  y,
}) => {
  const { t } = useTranslation();
  const { latestBuildRun, status } = getLatestBuildRunStatusforDeployment(buildRuns, resource);

  const statusIcon = <Status status={status} iconOnly noTooltip />;

  let tooltipContent;
  let decoratorContent;

  if (latestBuildRun) {
    tooltipContent = t(`shipwright-plugin~Build {{status}}`, { status });
    const resourceLabel =
      latestBuildRun.metadata?.labels?.[BUILDRUN_TO_RESOURCE_MAP_LABEL] || 'build-decorator';

    const link = `${resourcePathFromModel(
      BuildRunModel,
      latestBuildRun.metadata.name,
      latestBuildRun.metadata.namespace,
    )}/logs`;

    decoratorContent = (
      <Link to={link} data-test={`${resourceLabel}-decorator`}>
        <BuildDecoratorBubble x={x} y={y} radius={radius} ariaLabel={tooltipContent}>
          {statusIcon}
        </BuildDecoratorBubble>
      </Link>
    );
  } else {
    tooltipContent = t('shipwright-plugin~Build not started');

    decoratorContent = (
      <BuildDecoratorBubble x={x} y={y} radius={radius} ariaLabel={tooltipContent}>
        {statusIcon}
      </BuildDecoratorBubble>
    );
  }

  return (
    <Tooltip content={tooltipContent} position={TooltipPosition.left}>
      {decoratorContent}
    </Tooltip>
  );
};

export default connect(impersonateStateToProps)(ConnectedBuildRunDecorator);
