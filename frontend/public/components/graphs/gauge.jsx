import * as React from 'react';
import { relayout, register } from 'plotly.js/lib/core';
import * as pie from 'plotly.js/lib/pie';
// Horrible hack to get around plotly vs webpack incompatibility
register(pie);

import { BaseGraph } from './base';

const colors = {
  ok: 'rgb(46,201,141)',
  warn: 'rgb(246,167,37)',
  error: 'rgb(226,78,114)',
  clear: 'rgba(255, 255, 255, 0)',
  white: 'rgb(255, 255, 255)',
  gray: 'rgb(230,230,230)',
};

export class Gauge extends BaseGraph {
  constructor (props) {
    super(props);
    this.data = [
      {
        values: [0.5, 0.0, 1],
        rotation: 120,
        direction: 'clockwise',
        marker: {
          colors: [
            colors.clear,
            colors.ok,
            colors.gray,
          ]
        },
        textinfo: 'none',
        hole: .65,
        type: 'pie',
        showlegend: false,
        sort: false,
        hoverinfo: 'none',
      },
      // White Spacer Ring
      {
        values: [1],
        direction: 'clockwise',
        marker: {colors: [
          colors.white,
        ]},
        textinfo: 'none',
        hole: .94,
        type: 'pie',
        showlegend: false,
        sort: false,
        hoverinfo: 'none',
      },
      // Danger Zone Ring
      {
        values: [3, 4, 1.5, 0.5],
        rotation: 120,
        direction: 'clockwise',
        textinfo: 'none',
        marker: {
          colors:[
            colors.clear, colors.ok, colors.warn, colors.error,
          ],
        },
        hole: .95,
        type: 'pie',
        showlegend: false,
        sort: false,
        hoverinfo: 'none',
      },
    ];
    this.layout = {
      height: 170,
      xaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]},
      yaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]},
      // yanchor: 'bottom',
      margin: {
        l: 5,
        b: 5,
        r: 5,
        t: 15,
        pad: 10,
      },
      annotations: [
        {
          x: 0,
          y: -0.15,
          text: '...',
          showarrow: false,
          ax: 0,
          ay: 0,
          align: 'center',
          font: {
            size: 20,
            color: '#333'
          },
        }
      ],
    };
    this.options = {
      staticPlot: true,
    };
    this.timeSpan = 0;
    this.style = {
      height: 200,
      minWidth: 200,
      overflow: 'hidden',
    };
  }

  update (result) {
    const data = parseInt(result[0].data.result[0].value[1], 10);
    if (isNaN(data)) {
      console.error('data is NaN!', result);
      return;
    }
    const percent = Math.min(data, 100);
    this.data[0].values[1] = percent / 100;
    this.data[0].values[2] = (100 - percent) / 100;

    let color = colors.ok;
    if (percent >= 92) {
      color = colors.error;
    } else if (percent >= 67) {
      color = colors.warn;
    }
    this.data[0].marker.colors[1] = color;
    this.layout.annotations[0].text = `${data}%`;
    relayout(this.node, this.layout);
  }
}
