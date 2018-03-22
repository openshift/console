import * as _ from 'lodash-es';
import * as React from 'react';
import { relayout, restyle, register } from 'plotly.js/lib/core';
import * as bar from 'plotly.js/lib/bar';
// Horrible hack to get around plotly vs webpack incompatibility
register(bar);

import { BaseGraph } from './base';

const colors = {
  salmon: 'rgb(253,216,171)',
};

export class Bar extends BaseGraph {
  constructor (props) {
    super(props);
    this.data = [{
      y: [],
      x: [],
      type: 'bar',
      marker: {
        color: colors.salmon,
      },
      colorbar: {
        ypad: 1,
      },
      hoverinfo: 'none',
      sort: true,
      orientation: 'h',
    }];

    this.layout = {
      bargap: 0.05,
      xaxis: {zeroline: false, showticklabels: false, showgrid: false},
      yaxis: {zeroline: false, showticklabels: false, showgrid: false},
      margin: {
        l: 10,
        b: 18,
        r: 0,
        t: 15,
        pad: 0,
      },
      annotations: this.annotate([], []),
    };
    this.options = { staticPlot: true };
    this.style = { overflow: 'hidden' };
    this.timeSpan = 0;
  }

  annotate (texts, values) {
    const annotations = [];
    _.each(texts, (text, i) => {
      annotations.push({
        x: 0,
        y: i,
        text,
        showarrow: false,
        xanchor: 'left',
        xshift: 5,
        align: 'left',
        font: {
          size: 12,
          color: 'black'
        },
      }, {
        x: 0,
        y: i,
        text: `<span style="align: right;">${values[i]}</span>`,
        showarrow: false,
        xanchor: 'left',
        xshift: -70,
        width: 60,
        align: 'right',
        font: {
          size: 12,
          color: 'black'
        },
      });
    });
    return annotations;
  }

  updateGraph (data) {
    if (_.get(data, '[0].status') !== 'success') {
      return;
    }
    const newX = [];
    const newY = [];
    const metricName = this.props.metric;
    _.each(data[0].data.result, ({metric, value}, i) => {
      newY.push(metric[metricName] || `(unknown #${i})`);
      newX.push(parseFloat(value[1], 10));
    });

    restyle(this.node, {
      x: [newX],
      y: [newY],
      name,
    }, [0]).catch(e => {
      // eslint-disable-next-line no-console
      console.error(e);
    });

    this.layout.annotations = this.annotate(newY, newX.map(this.props.humanize));
    relayout(this.node, this.layout);
  }
}
