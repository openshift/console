import * as React from 'react';
import { ChartDonutProps } from '@patternfly/react-charts';
import { ChartDonut, ChartLabel } from '@patternfly/react-charts/victory';
import * as _ from 'lodash';

interface SuccessRatioDonutProps {
  successValue: number;
}

const SuccessRatioDonut: React.FC<SuccessRatioDonutProps & ChartDonutProps> = ({
  data,
  width,
  successValue = 0,
  ariaDesc,
  ariaTitle,
  title,
  subTitle,
}) => {
  return (
    <ChartDonut
      ariaDesc={ariaDesc}
      ariaTitle={ariaTitle}
      constrainToVisibleArea
      data={data}
      sortKey={successValue ? ['success', 'failed', 'cancelled'] : ['failed', 'cancelled']}
      labels={({ datum }) => `${_.capitalize(datum.x)}: ${datum.y}%`}
      padding={{
        bottom: 20,
        left: 20,
        right: 20,
        top: 20,
      }}
      subTitle={subTitle}
      subTitleComponent={
        <ChartLabel
          style={{
            fill:
              'var(--pf-t--temp--dev--tbd)' /* CODEMODS: original v5 color was --pf-v5-global--Color--400 */,
            fontSize: 14,
          }}
        />
      }
      title={title}
      titleComponent={
        <ChartLabel
          style={{
            fill:
              'var(--pf-t--temp--dev--tbd)' /* CODEMODS: original v5 color was --pf-v5-global--Color--100 */,
            fontSize: 24,
          }}
        />
      }
      width={width}
      style={{
        data: {
          fill: ({ datum }) => datum.fill,
        },
      }}
    />
  );
};

export default SuccessRatioDonut;
