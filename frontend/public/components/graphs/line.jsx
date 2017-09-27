import * as React from 'react';
import { restyle } from 'plotly.js/lib/core';

import { BaseGraph } from './base';

const baseData = {
  x: [],
  y: [],
  mode: 'lines',
  fill: 'tozeroy',
  type: 'scatter',
};

export class Line extends BaseGraph {
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
        color: '#333',
      },
      xaxis: {
        zeroline: false,
        tickformat:'%H:%M',
        color: '#333',
      },
      legend: {
        x: 0, y: 1,
        bgcolor: 'rgba(255, 255, 255, 0)',
        orientation: 'h'
      },
      margin: {
        l: 50,
        b: 30,
        r: 10,
        t: 10,
        pad: 10,
      },
    };
    this.style={width: '100%'};
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
    _.each(data, (result, i) => {
      const query = this.props.query[i];
      const name = query && query.name;
      if (result.data.result.length === 0) {
        // eslint-disable-next-line no-console
        console.warn('no data for query', query);
        return;
      }
      const data = result.data.result[0].values;
      restyle(this.node, {
        x: [data.map(v => new Date(v[0] * 1000))],
        y: [data.map(v => v[1])],
        name,
      }, [i]).catch(e => {
        // eslint-disable-next-line no-console
        console.error(e);
      });
    });
  }
}
