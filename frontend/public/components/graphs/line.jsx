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
      yaxis: {
        rangemode: 'tozero',
        zeroline: false,
        color: '#333',
        // yaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]}
      },
      xaxis: {
        zeroline: false,
        tickformat:'%H:%M',
        // tickcolor: '#DDD',
        color: '#333',
        // range: ['0', '2016-12-31'],
        // type: 'linear'
      },
      legend: {
        x: 0, y: 1,
        bgcolor: 'rgba(255, 255, 255, 0)',
        orientation: 'h'
      }
    };
  }

  update (results) {
    _.each(results, (result, i) => {
      const query = this.props.query[i];
      const name = query && query.name;
      const data = result.data.result[0].values;

      // TODO (ggreer): handle multiple lines
      restyle(this.node, {
        x: [data.map(v => new Date(v[0] * 1000))],
        y: [data.map(v => v[1])],
        name,
      }, [i])
        .catch(e => console.error(e));
    });
  }
}
