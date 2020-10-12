import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut } from '@patternfly/react-charts';
import { Tooltip } from '@patternfly/react-core';
import { ExtPodKind } from '../../types';
import { calculateRadius, podStatus, getPodStatus } from '../../utils/pod-utils';
import { podColor, AllPodStatus } from '../../constants';
import './PodStatus.scss';

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
  data: ExtPodKind[];
  showTooltip?: boolean;
  title?: string;
  titleComponent?: React.ReactElement;
  subTitle?: string;
  subTitleComponent?: React.ReactElement;
};

type PodStatusState = {
  vData: PodData[];
  updateOnEnd: boolean;
  tipIndex?: number;
};

const { podStatusInnerRadius, podStatusOuterRadius } = calculateRadius(130); // default value of size is 130

const podStatusIsNumeric = (podStatusValue: string) => {
  return (
    podStatusValue !== AllPodStatus.ScaledTo0 &&
    podStatusValue !== AllPodStatus.AutoScaledTo0 &&
    podStatusValue !== AllPodStatus.Idle &&
    podStatusValue !== AllPodStatus.ScalingUp
  );
};

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
      _.update(vData, `[${_.findKey(vData, { x: AllPodStatus.ScaledTo0 })}]['y']`, () => 1);
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
      titleComponent,
      subTitleComponent,
    } = this.props;
    const { vData, updateOnEnd } = this.state;

    const chartDonut = (
      <ChartDonut
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
        titleComponent={titleComponent}
        subTitleComponent={subTitleComponent}
        subTitle={subTitle}
        allowTooltip={false}
        labels={() => null}
        /*
            // @ts-ignore */
        padAngle={({ datum }) => (datum.y > 0 ? 2 : 0)}
        style={{
          data: {
            fill: ({ datum }) => podColor[datum.x],
            stroke: ({ datum }) =>
              !podStatusIsNumeric(datum.x) && datum.y > 0 ? '#BBBBBB' : 'none',
            strokeWidth: 1,
          },
        }}
      />
    );
    if (showTooltip) {
      const tipContent = (
        <div className="odc-pod-status-tooltip">
          {vData.map((data) => {
            return data.y > 0 ? (
              <div key={data.x} className="odc-pod-status-tooltip__content">
                <span
                  className="odc-pod-status-tooltip__status-box"
                  style={{ background: podColor[data.x] }}
                />
                {podStatusIsNumeric(data.x) && (
                  <span key={3} className="odc-pod-status-tooltip__status-count">
                    {`${Math.round(data.y)}`}
                  </span>
                )}
                {data.x}
              </div>
            ) : null;
          })}
        </div>
      );
      return <Tooltip content={tipContent}>{chartDonut}</Tooltip>;
    }
    return chartDonut;
  }
}

export default React.memo((props: PodStatusProps) => <PodStatus {...props} />);
