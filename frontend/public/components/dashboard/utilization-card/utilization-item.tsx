import * as React from 'react';
import { Col, Row } from 'patternfly-react';
import { global_breakpoint_sm as breakpointSM } from '@patternfly/react-tokens';

import { useRefWidth, Humanize } from '../../utils';
import { DataPoint } from '../../graphs';
import { AreaChart } from '../../graphs/area';

export const UtilizationItem: React.FC<UtilizationItemProps> = React.memo(
  ({ title, data, humanizeValue, isLoading = false, query }) => {
    const [containerRef, width] = useRefWidth();

    let current;
    if (data.length) {
      const latestData = data[data.length - 1];
      current = humanizeValue(latestData.y).string;
    }

    const chart = (
      <AreaChart
        data={data}
        loading={isLoading}
        query={query}
        xAxis={false}
        humanize={humanizeValue}
        padding={{ top: 13, left: 70, bottom: 0, right: 0 }}
        height={80}
        className="co-utilization-card__area-chart"
      />
    );

    const rows = width < parseInt(breakpointSM.value, 10) ? (
      <div className="co-utilization-card__item">
        <Row className="co-utilization-card__item-row--narrow co-utilization-card__item-title-row--narrow">
          <Col lg={6} md={6} sm={6} xs={6} className="co-utilization-card__item-title co-dashboard-text--small">
            {title}
          </Col>
          <Col className="co-utilization-card__item-current co-dashboard-text--small" lg={6} md={6} sm={6} xs={6}>
            {current}
          </Col>
        </Row>
        <Row className="co-utilization-card__item-row--narrow">
          <Col className="co-utilization-card__item-chart co-utilization-card__item-chart--narrow">{chart}</Col>
        </Row>
      </div>
    ) : (
      <Row className="co-utilization-card__item co-utilization-card__item--wide">
        <Col className="co-utilization-card__item-title" lg={3} md={3} sm={3} xs={3}>
          {title}
        </Col>
        <Col className="co-utilization-card__item-current" lg={2} md={2} sm={2} xs={2}>
          {current}
        </Col>
        <Col
          className="co-utilization-card__item-chart co-utilization-card__item-chart--wide"
          lg={7}
          md={7}
          sm={7}
          xs={7}
        >
          {chart}
        </Col>
      </Row>
    );

    return <div ref={containerRef}>{rows}</div>;
  }
);

type UtilizationItemProps = {
  title: string;
  data?: DataPoint[];
  isLoading: boolean,
  humanizeValue: Humanize,
  query: string,
};
