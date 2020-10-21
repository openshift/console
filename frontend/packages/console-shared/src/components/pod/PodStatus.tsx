import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut } from '@patternfly/react-charts';
import { Tooltip } from '@patternfly/react-core';
import { ExtPodKind } from '../../types';
import { useForceUpdate } from '../../hooks/useForceUpdate';
import { calculateRadius, podStatus, getPodStatus } from '../../utils/pod-utils';
import { podColor, AllPodStatus } from '../../constants';

import './PodStatus.scss';

const ANIMATION_DURATION = 350;

type PodData = {
  x: string;
  y: number;
};

interface PodStatusProps {
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
}

const { podStatusInnerRadius, podStatusOuterRadius } = calculateRadius(130); // default value of size is 130

const podStatusIsNumeric = (podStatusValue: string) => {
  return (
    podStatusValue !== AllPodStatus.ScaledTo0 &&
    podStatusValue !== AllPodStatus.AutoScaledTo0 &&
    podStatusValue !== AllPodStatus.Idle &&
    podStatusValue !== AllPodStatus.ScalingUp
  );
};

const PodStatus: React.FC<PodStatusProps> = ({
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
  data,
}) => {
  const [updateOnEnd, setUpdateOnEnd] = React.useState<boolean>(false);
  const forceUpdate = useForceUpdate();
  const prevVData = React.useRef<PodData[]>(null);

  const vData = React.useMemo(() => {
    const updateVData: PodData[] = podStatus.map((pod) => ({
      x: pod,
      y: _.sumBy(data, (d) => +(getPodStatus(d) === pod)) || 0,
    }));

    if (_.isEmpty(data)) {
      _.update(
        updateVData,
        `[${_.findKey(updateVData, { x: AllPodStatus.ScaledTo0 })}]['y']`,
        () => 1,
      );
    }

    const prevDataPoints = _.size(_.filter(prevVData.current, (nextData) => nextData.y !== 0));
    const dataPoints = _.size(_.filter(updateVData, (nextData) => nextData.y !== 0));
    setUpdateOnEnd(dataPoints === 1 && prevDataPoints > 1);

    if (!_.isEqual(prevVData.current, updateVData)) {
      prevVData.current = updateVData;
      return updateVData;
    }
    return prevVData.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const chartDonut = React.useMemo(() => {
    return (
      <ChartDonut
        animate={{
          duration: ANIMATION_DURATION,
          onEnd: updateOnEnd ? forceUpdate : undefined,
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
  }, [
    forceUpdate,
    innerRadius,
    outerRadius,
    size,
    standalone,
    subTitle,
    subTitleComponent,
    title,
    titleComponent,
    updateOnEnd,
    vData,
    x,
    y,
  ]);

  if (!vData) {
    return null;
  }

  if (showTooltip) {
    const tipContent = (
      <div className="odc-pod-status-tooltip">
        {vData.map((d) => {
          return d.y > 0 ? (
            <div key={d.x} className="odc-pod-status-tooltip__content">
              <span
                className="odc-pod-status-tooltip__status-box"
                style={{ background: podColor[d.x] }}
              />
              {podStatusIsNumeric(d.x) && (
                <span key={3} className="odc-pod-status-tooltip__status-count">
                  {`${Math.round(d.y)}`}
                </span>
              )}
              {d.x}
            </div>
          ) : null;
        })}
      </div>
    );
    return <Tooltip content={tipContent}>{chartDonut}</Tooltip>;
  }
  return chartDonut;
};

export default React.memo((props: PodStatusProps) => <PodStatus {...props} />);
