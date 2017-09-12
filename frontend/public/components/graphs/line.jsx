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
  }

  update (results) {
    _.each(results, (result, i) => {
      const query = this.props.query[i];
      const name = query && query.name;
      if (result.data.result.length === 0) {
        console.warn('no data for query', query);
      }
      const data = result.data.result[0].values;
      restyle(this.node, {
        x: [data.map(v => new Date(v[0] * 1000))],
        y: [data.map(v => v[1])],
        name,
      }, [i])
        .catch(e => console.error(e));
    });
  }
}
