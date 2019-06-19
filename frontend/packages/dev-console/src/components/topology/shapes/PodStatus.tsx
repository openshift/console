import * as React from 'react';
import * as _ from 'lodash';
import { VictoryPie } from 'victory';
import { Pod } from '../topology-types';
import Tooltip from '../SvgPodTooltip';
import { podColor, getPodStatus, podStatus } from '../topology-utils';

type PodData = {
  x: string;
  y: number;
};

type PodStatusProps = {
  innerRadius: number;
  outerRadius: number;
  size: number;
  standalone?: boolean;
  x?: number;
  y?: number;
  data: Pod[];
  showTooltip?: boolean;
};

class PodStatus extends React.PureComponent<PodStatusProps> {
  render() {
    const {
      innerRadius,
      outerRadius,
      x,
      y,
      data,
      size,
      standalone = false,
      showTooltip = true,
    } = this.props;
    const vData: PodData[] = podStatus.map((pod) => ({
      x: pod,
      y: _.sumBy(data, (d) => +(getPodStatus(d) === pod)) || 0,
    }));
    const tooltipEvent: any = showTooltip
      ? [
          {
            target: 'data',
            eventHandlers: {
              onMouseOver: () => {
                return [
                  {
                    target: 'labels',
                    mutation: () => {
                      return { active: true };
                    },
                  },
                ];
              },
              onMouseOut: () => {
                return [
                  {
                    target: 'labels',
                    mutation: () => {
                      return { active: false };
                    },
                  },
                ];
              },
            },
          },
        ]
      : undefined;
    return (
      <VictoryPie
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
        labelComponent={<Tooltip x={size / 2} y={size * -0.2} />}
        /*
          // @ts-ignore */
        padAngle={(d: PodData) => (d.y > 0 ? 2 : 0)}
        style={{
          data: {
            fill: (d: PodData) => podColor[d.x],
            stroke: (d: PodData) => (d.x === 'Scaled to 0' && d.y > 0 ? '#BBBBBB' : 'none'),
            strokeWidth: 1,
          },
        }}
      />
    );
  }
}

export default PodStatus;
