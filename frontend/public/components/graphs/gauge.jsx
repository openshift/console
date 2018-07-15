import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { relayout, register } from 'plotly.js/lib/core';
import * as pie from 'plotly.js/lib/pie';
// Horrible hack to get around plotly vs webpack incompatibility
register(pie);

import { BaseGraph } from './base';
import { connectToURLs, MonitoringRoutes } from '../../monitoring';

const colors = {
  ok: 'rgb(46,201,141)',
  warn: '#f9c97b',
  error: 'rgb(226,78,114)',
  clear: 'rgba(255, 255, 255, 0)',
  white: 'rgb(255, 255, 255)',
  gray: 'rgb(230,230,230)',
};

const fontColors = {
  ok: '#2fc98e',
  warn: 'rgb(246,167,37)',
  error: '#d64456',
};

class Gauge_ extends BaseGraph {
  constructor (props) {
    super(props);

    this.timeSpan = 0;
    this.style = {
      height: 150,
    };

    this.options = { staticPlot: true };

    this.layout = {
      height: 125,
      xaxis: {zeroline: false, showticklabels: false, showgrid: false, range: [-1, 1]},
      yaxis: {zeroline: false, showticklabels: false, showgrid: false, range: [-1, 1]},
      margin: {
        l: 5,
        b: 5,
        r: 5,
        t: 20,
        pad: 10,
      },
      annotations: [{
        x: 0,
        y: -0.05,
        text: '...',
        showarrow: false,
        ax: 0,
        ay: 0,
        align: 'center',
        font: {
          size: 20,
          color: '#333'
        },
      }],
    };

    const { thresholds } = this.props;

    // Set up correct portions for the ok/warn/error sections surrounding the gauge value.
    // First element is clear and takes up 1/3rd of the pie
    const ringValues = [50, thresholds.warn, (thresholds.error - thresholds.warn), 100 - thresholds.error];
    if (props.invert) {
      // Inverted graph (100% === good). Reverse order of ok/warn/error.
      ringValues[1] = 100 - thresholds.error;
      ringValues[3] = thresholds.warn;
    }

    this.data = [{
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
    }, {
      // White Spacer Ring
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
    }, {
      // Danger Zone Ring
      values: ringValues,
      rotation: 120,
      direction: 'clockwise',
      textinfo: 'none',
      marker: {
        colors: props.invert ? [colors.clear, colors.error, colors.warn, colors.ok] : [colors.clear, colors.ok, colors.warn, colors.error],
      },
      hole: .95,
      type: 'pie',
      showlegend: false,
      sort: false,
      hoverinfo: 'none',
    }];
  }

  updateGraph (data, err) {
    if (err) {
      this.data[0].marker.colors[1] = colors.gray;
      this.data[0].values[1] = 0;
      this.data[0].values[2] = 1;
      this.layout.annotations[0].text = '?';
      relayout(this.node, this.layout);
      return;
    }
    data = parseFloat(_.get(data, '[0].data.result[0].value[1]'), 10);
    if (isNaN(data)) {
      // eslint-disable-next-line no-console
      console.warn(`Graph error: No data from query ${this.props.query}`);
      return;
    }
    const percent = Math.min(data, 100);
    this.data[0].values[1] = percent / 100;
    this.data[0].values[2] = (100 - percent) / 100;

    const { invert, thresholds } = this.props;

    let errorState = 'ok';
    if (invert) {
      if (percent <= 100 - thresholds.error) {
        errorState = 'error';
      } else if (percent <= 100 - thresholds.warn) {
        errorState = 'warn';
      }
    } else {
      if (percent >= thresholds.error) {
        errorState = 'error';
      } else if (percent >= thresholds.warn) {
        errorState = 'warn';
      }
    }

    const color = colors[errorState];
    const fontColor = fontColors[errorState];

    this.data[0].marker.colors[1] = color;
    if (data < 1) {
      data = data.toFixed(1);
    } else {
      data = Math.round(data);
    }
    this.layout.annotations[0].text = `${data}%`;
    this.layout.annotations[0].font.color = fontColor;
    relayout(this.node, this.layout);
  }
}
export const Gauge = connectToURLs(MonitoringRoutes.Prometheus)(Gauge_);

Gauge.defaultProps = {
  invert: false,
  thresholds: {
    warn: 67,
    error: 92,
  },
};

Gauge_.contextTypes = {
  urls: PropTypes.object,
};
