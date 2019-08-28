import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut } from '@patternfly/react-charts';
import Tooltip from '../SvgPodTooltip';
import { Pod } from '../../types';
import { calculateRadius, podStatus, getPodStatus, podColor } from '../../utils';

const ANIMATION_DURATION = 350;

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

type PodStatusState = {
  vData: PodData[];
  updateOnEnd: boolean;
};

const { podStatusInnerRadius, podStatusOuterRadius } = calculateRadius(130); // default value of size is 130

class PodStatus extends React.Component<PodStatusProps, PodStatusState> {
  constructor(props) {
    super(props);
    this.state = {
      vData: [],
      updateOnEnd: false,
    };
  }

  static getDerivedStateFromProps(
    nextProps: PodStatusProps,
    prevState: PodStatusState,
  ): PodStatusState {
    const { data } = nextProps;

    if (prevState.updateOnEnd) {
      // Animations complete, remove empty slices
      return {
        vData: _.filter(prevState.vData, (nextData) => nextData.y !== 0),
        updateOnEnd: false,
      };
    }

    const vData: PodData[] = podStatus.map((pod) => ({
      x: pod,
      y: _.sumBy(data, (d) => +(getPodStatus(d) === pod)) || 0,
    }));

    if (_.isEmpty(data)) {
      _.update(vData, `[${_.findKey(vData, { x: 'Scaled to 0' })}]['y']`, () => 1);
    }

    // Determine if we have moved to just 1 data point left
    const prevDataPoints = _.size(_.filter(prevState.vData, (nextData) => nextData.y !== 0));
    const dataPoints = _.size(_.filter(vData, (nextData) => nextData.y !== 0));

    return { vData, updateOnEnd: dataPoints === 1 && prevDataPoints > 1 };
  }

  doUpdate = () => {
    // Animations complete, update to remove empty slices
    this.forceUpdate();
  };

  render() {
    const {
      innerRadius = podStatusInnerRadius,
      outerRadius = podStatusOuterRadius,
      x,
      y,
      size = 130,
      standalone = false,
      showTooltip = true,
      title = '',
      subTitle = '',
    } = this.props;
    const { vData, updateOnEnd } = this.state;

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
      <ChartDonut
        events={tooltipEvent}
        animate={{
          duration: ANIMATION_DURATION,
          onEnd: updateOnEnd ? this.doUpdate : undefined,
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
        labelComponent={<Tooltip x={0} y={0} width={size} height={size * -0.2} />}
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
    );
  }
}

export default PodStatus;
