import * as React from 'react';
import { restyle } from 'plotly.js/lib/core';

import { BaseGraph } from './base';

export class Line extends BaseGraph {
  constructor (props) {
    super(props);
    this.data = [{
      x: [],
      y: [],
      mode: 'lines',
      line: {
        color: 'rgb(127, 171, 222)',
      },
      fill: 'tozeroy',
      type: 'scatter',
    }];
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
    };
  }

  update (result) {
    const data = result.data.result[0].values;

    // TODO (ggreer): handle multiple lines
    restyle(this.node, {
      x: [data.map(v => new Date(v[0] * 1000))],
      y: [data.map(v => v[1])],
    }, [0])
      .catch(e => console.error(e));
  }
}
