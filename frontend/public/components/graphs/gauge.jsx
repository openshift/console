import * as React from 'react';
import { restyle, relayout } from 'plotly.js/lib/core';

import { BaseGraph } from './base';

export class Gauge extends BaseGraph {
  constructor (props) {
    super(props);
    const path = this.calculatePath(0);
    this.data = [{ type: 'scatter',
      x: [0], y:[0],
      marker: {size: 28, color:'850000'},
      showlegend: false,
      name: 'percent',
      text: 0,
      hoverinfo: 'text+name'},
    { values: [50/6, 50/6, 50/6, 50/6, 50/6, 50/6, 50],
      rotation: 90,
      text: ['TOO FAST!', 'Pretty Fast', 'Fast', 'Average', 'Slow', 'Super Slow', ''],
      textinfo: 'text',
      textposition:'inside',
      marker: {colors:[
        'rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, .5)',
        'rgba(170, 202, 42, .5)', 'rgba(202, 209, 95, .5)',
        'rgba(210, 206, 145, .5)', 'rgba(232, 226, 202, .5)',
        'rgba(255, 255, 255, 0)'
      ]},
      labels: ['151-180', '121-150', '91-120', '61-90', '31-60', '0-30', ''],
      hoverinfo: 'label',
      hole: .5,
      type: 'pie',
      showlegend: false
    }];
    this.layout = {
      shapes:[{
        type: 'path',
        path: path,
        fillcolor: '850000',
        line: {
          color: '850000'
        }
      }],
      height: 400,
      width: 400,
      xaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]},
      yaxis: {zeroline:false, showticklabels:false, showgrid: false, range: [-1, 1]}
    };
  }

  calculatePath (percent) {
    // Trig to calc meter point
    const degrees = 180 - percent;
    const radius = .5;
    const radians = degrees * Math.PI / 180;
    const x = radius * Math.cos(radians);
    const y = radius * Math.sin(radians);

    // Path: may have to change to create a better triangle
    const mainPath = 'M -.0 -0.025 L .0 0.025 L ';
    const pathX = String(x);
    const space = ' ';
    const pathY = String(y);
    const pathEnd = ' Z';
    return mainPath.concat(pathX, space, pathY, pathEnd);
  }

  update (result) {
    const data = parseInt(result.data.result[0].values.slice(-1)[0][1], 10);
    if (isNaN(data)) {
      return;
    }
    this.layout.shapes[0].path = this.calculatePath(data);
    this.data[0].text = data;
    relayout(this.node, this.layout);
    restyle(this.node, this.data).catch(() => {});
  }
}
