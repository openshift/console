import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { restyle } from 'plotly.js/lib/core';

import { BaseGraph } from './base';
import { connectToURLs, MonitoringRoutes } from '../../monitoring';

const baseData = {
  x: [],
  y: [],
  mode: 'lines',
  fill: 'tozeroy',
  type: 'scatter',
};

export class Line_ extends BaseGraph {
  constructor (props) {
    super(props);

    let queries = props.query;
    if (!_.isArray(queries)) {
      queries = [queries];
    }

    this.data = queries.map(() => Object.assign({}, baseData));
    this.layout = {
      dragmode: 'pan',
      yaxis: {
        rangemode: 'tozero',
        zeroline: false,
        ticks: '',
        showline: false,
        fixedrange: true,
      },
      xaxis: {
        zeroline: false,
        tickformat:'%H:%M',
        ticks: '',
        showline: false,
        fixedrange: true,
      },
      legend: {
        x: 0, y: 1,
        bgcolor: 'rgba(255, 255, 255, 0.5)',
        size: '12px',
        orientation: 'h'
      },
      margin: {
        l: 30,
        b: 30,
        r: 10,
        t: 0,
        pad: 0,
      },
      shapes: [],
    };
    this.options = {
      displaylogo: false,
      displayModeBar: false,
    };
    this.style = { width: '100%' };
    this.onPlotlyRelayout = e => {
      if (!e) {
        return;
      }
      let start = this.start;
      let end = this.end;
      if (e['xaxis.autorange']) {
        end = null;
        start = null;
      } else if (e['xaxis.range[1]'] && e['xaxis.range[0]']) {
        end = new Date(e['xaxis.range[1]']).getTime();
        start = new Date(e['xaxis.range[0]']).getTime();
      }
      if (start === this.start && end === this.end) {
        return;
      }
      this.start = start;
      this.end = end;
      clearInterval(this.interval);
      this.fetch();
    };
  }

  componentDidMount () {
    super.componentDidMount();
    this.node.on('plotly_relayout', this.onPlotlyRelayout);
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    this.node.removeListener('plotly_relayout', this.onPlotlyRelayout);
  }

  updateGraph (data) {
    let queries = this.props.query;
    if (!_.isArray(queries)) {
      queries = [{
        query: queries,
        name: this.props.title,
      }];
    }
    _.each(data, (result, i) => {
      const query = queries[i];
      const name = query && query.name;
      if (result.data.result.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`Graph error: No data from query for ${name || query}.`);
        return;
      }
      const lineValues = result.data.result[0].values;
      restyle(this.node, {
        x: [lineValues.map(v => new Date(v[0] * 1000))],
        y: [lineValues.map(v => v[1])],
        // Use a lighter fill color on first line in graphs
        fillcolor: i === 0 ? 'rgba(31, 119, 190, 0.3)': undefined,
        name,
      }, [i]).catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
    });
  }
}
export const Line = connectToURLs(MonitoringRoutes.Prometheus)(Line_);

Line_.contextTypes = {
  urls: PropTypes.object,
};
