import * as React from 'react';
import {
  ExternalLinkAltIcon,
  GitAltIcon,
  GitlabIcon,
  GithubIcon,
  BitbucketIcon,
} from '@patternfly/react-icons';
import { Status, calculateRadius, PodStatus, GreenCheckCircleIcon } from '@console/shared';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { detectGitType } from '../../import/import-validation-utils';
import { NodeProps, WorkloadData } from '../topology-types';
import Decorator from './Decorator';
import BaseNode from './BaseNode';
import KnativeIcon from './KnativeIcon';

const WorkloadNode: React.FC<NodeProps<WorkloadData>> = ({
  data: workload,
  x,
  y,
  size,
  selected,
  onSelect,
  isDragging,
}) => {
  const { radius, podStatusOuterRadius, podStatusInnerRadius, decoratorRadius } = calculateRadius(
    size,
  );
  const {
    data: {
      donutStatus: { build },
    },
  } = workload;
  const [hoverDecorator, setHoverDecorator] = React.useState(null);
  const [hoverTimeout, setHoverTimeout] = React.useState(null);

  const routeDecoratorIcon = (editUrl: string): React.ReactElement => {
    switch (detectGitType(editUrl)) {
      case 'github':
        return <GithubIcon style={{ fontSize: decoratorRadius }} alt="Edit Source Code" />;
      case 'bitbucket':
        return <BitbucketIcon style={{ fontSize: decoratorRadius }} alt="Edit Source Code" />;
      case 'gitlab':
        return <GitlabIcon style={{ fontSize: decoratorRadius }} alt="Edit Source Code" />;
      default:
        return <GitAltIcon style={{ fontSize: decoratorRadius }} alt="Edit Source Code" />;
    }
  };

  const updateHover = (isHover: boolean, decorator: string) => {
    if (!isHover) {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
      setHoverDecorator(null);
      return;
    }

    if (!hoverTimeout) {
      setHoverTimeout(
        setTimeout(() => {
          setHoverDecorator(decorator);
        }, 200),
      );
    }
  };

  return (
    <BaseNode
      x={x}
      y={y}
      outerRadius={radius}
      innerRadius={radius * 0.55}
      icon={workload.data.builderImage}
      label={workload.name}
      kind={workload.data.kind}
      selected={selected}
      onSelect={onSelect}
      isDragging={isDragging}
      attachments={[
        workload.data.editUrl && (
          <Tooltip
            key="edit"
            content="Edit Source Code"
            position={TooltipPosition.right}
            tippyProps={{ duration: 0 }}
            trigger="manual"
            isVisible={hoverDecorator === 'edit source'}
          >
            <Decorator
              x={radius - decoratorRadius * 0.7}
              y={radius - decoratorRadius * 0.7}
              radius={decoratorRadius}
              href={workload.data.editUrl}
              external
              onHoverChange={(isHover: boolean) => updateHover(isHover, 'edit source')}
            >
              <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                {routeDecoratorIcon(workload.data.editUrl)}
              </g>
            </Decorator>
          </Tooltip>
        ),
        workload.data.url && (
          <Tooltip
            key="route"
            content="Open URL"
            position={TooltipPosition.right}
            tippyProps={{ duration: 0 }}
            trigger="manual"
            isVisible={hoverDecorator === 'open url'}
          >
            <Decorator
              x={radius - decoratorRadius * 0.7}
              y={-radius + decoratorRadius * 0.7}
              radius={decoratorRadius}
              href={workload.data.url}
              external
              onHoverChange={(isHover: boolean) => updateHover(isHover, 'open url')}
            >
              <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                <ExternalLinkAltIcon style={{ fontSize: decoratorRadius }} alt="Open URL" />
              </g>
            </Decorator>
          </Tooltip>
        ),
        build && (
          <Link
            key="build"
            to={resourcePathFromModel(BuildModel, build.metadata.name, build.metadata.namespace)}
            className="odc-decorator__link"
          >
            <Tooltip
              content={`${build.metadata.name} ${build.status && build.status.phase}`}
              position={TooltipPosition.left}
              tippyProps={{ duration: 0 }}
              trigger="manual"
              isVisible={hoverDecorator === 'build status'}
            >
              <Decorator
                x={-radius + decoratorRadius * 0.7}
                y={radius - decoratorRadius * 0.7}
                radius={decoratorRadius}
                onHoverChange={(isHover: boolean) => updateHover(isHover, 'build status')}
              >
                <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                  {build.status.phase === 'Complete' ? (
                    <GreenCheckCircleIcon
                      alt={`${build.metadata.name} ${build.status && build.status.phase}`}
                    />
                  ) : (
                    <foreignObject
                      width={decoratorRadius}
                      height={decoratorRadius}
                      style={{ fontSize: decoratorRadius }}
                    >
                      <Status
                        title={`${build.metadata.name} ${build.status && build.status.phase}`}
                        status={build.status.phase}
                        iconOnly
                      />
                    </foreignObject>
                  )}
                </g>
              </Decorator>
            </Tooltip>
          </Link>
        ),
      ]}
    >
      <PodStatus
        x={-size / 2}
        y={-size / 2}
        innerRadius={podStatusInnerRadius}
        outerRadius={podStatusOuterRadius}
        data={workload.data.donutStatus.pods}
        size={size}
      />
      {workload.data.isKnativeResource && (
        <KnativeIcon
          x={-radius * 0.15}
          y={-radius * 0.65}
          width={radius * 0.39}
          height={radius * 0.31}
        />
      )}
    </BaseNode>
  );
};

export default WorkloadNode;
