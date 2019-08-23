import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut } from '@patternfly/react-charts';
import { Tooltip } from '@patternfly/react-core';
import { Pod } from '../../types';
import { calculateRadius, podStatus, getPodStatus, podColor } from '../../utils';
import './PodStatus.scss';

type PodData = {
  x: string;
  y: number;
};

type PodStatusProps = {
  innerRadius?: number;
  outerRadius?: number;
  size?: number;
  standalone?: boolean;
  x?: number;
  y?: number;
  data: Pod[];
  showTooltip?: boolean;
  title?: string;
  subTitle?: string;
};

const { podStatusInnerRadius, podStatusOuterRadius } = calculateRadius(130); // default value of size is 130

const PodStatus: React.FC<PodStatusProps> = ({
  innerRadius = podStatusInnerRadius,
  outerRadius = podStatusOuterRadius,
  x,
  y,
  data,
  size = 130,
  standalone = false,
  showTooltip = true,
  title = '',
  subTitle = '',
}) => {
  const [tipContent, setTipContent] = React.useState(<span />);
  const [hover, setHover] = React.useState(false);
  const [hoverTimeout, setHoverTimeout] = React.useState(null);

  const vData: PodData[] = podStatus.map((pod) => ({
    x: pod,
    y: _.sumBy(data, (d) => +(getPodStatus(d) === pod)) || 0,
  }));

  if (_.isEmpty(data)) {
    _.update(vData, `[${_.findKey(vData, { x: 'Scaled to 0' })}]['y']`, () => 1);
  }

  const tooltipEvent: any = showTooltip
    ? [
        {
          target: 'data',
          eventHandlers: {
            onMouseOver: (e: Event, segmentData: any) => {
              const { datum } = segmentData;
              const content = datum ? (
                <span className="odc-pod-status-tip">
                  <span
                    className="odc-pod-status-tip__status-box"
                    style={{ background: podColor[datum.x] }}
                  />
                  <span className="odc-pod-status-tip__status-text">{datum.x}</span>
                  {datum.x !== 'Scaled to 0' &&
                    datum.x !== 'Autoscaled to 0' &&
                    datum.x !== 'Idle' && <span>{Math.round(datum.y)}</span>}
                </span>
              ) : (
                <span />
              );
              setTipContent(content);

              if (!hover) {
                setHoverTimeout(
                  setTimeout(() => {
                    setHover(true);
                    setHoverTimeout(null);
                  }, 200),
                );
              }
            },
            onMouseOut: () => {
              if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
              }
              setHover(false);
            },
          },
        },
      ]
    : undefined;

  return (
    <Tooltip content={tipContent} tippyProps={{ duration: 0 }} trigger="manual" isVisible={hover}>
      <ChartDonut
        events={tooltipEvent}
        animate={{
          duration: 2000,
        }}
        standalone={standalone}
        innerRadius={innerRadius}
        radius={outerRadius}
        groupComponent={x && y ? <g transform={`translate(${x}, ${y})`} /> : undefined}
        data={vData}
        height={size}
        width={size}
        title={title}
        subTitle={subTitle}
        /*
          // @ts-ignore */
        padAngle={(d: PodData) => (d.y > 0 ? 2 : 0)}
        style={{
          data: {
            fill: (d: PodData) => podColor[d.x],
            stroke: (d: PodData) =>
              (d.x === 'Scaled to 0' || d.x === 'Idle' || d.x === 'Autoscaled to 0') && d.y > 0
                ? '#BBBBBB'
                : 'none',
            strokeWidth: 1,
          },
        }}
      />
    </Tooltip>
  );
};

export default PodStatus;
