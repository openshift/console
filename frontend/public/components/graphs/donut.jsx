import * as _ from 'lodash-es';
import * as React from 'react';

import { SafetyFirst } from '../safety-first';
import { plot, Plots, relayout } from 'plotly.js/lib/core';

const colors = {
  '3': ['#3182bd', '#9ecae1', '#deebf7'],
  '4': ['#2171b5', '#6baed6', '#bdd7e7', '#eff3ff'],
  '5': ['#08519c', '#3182bd', '#6baed6', '#bdd7e7', '#eff3ff'],
  '6': ['#08519c', '#3182bd', '#6baed6', '#9ecae1', '#c6dbe', '#eff3ff'],
  '7': ['#084594', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#eff3ff'],
  '8': ['#084594', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#f7fbff'],
  '9': ['#084594', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1', '#c6dbef', '#deebf7', '#f7fbff'],
};

/** @augments {React.Component<{fetch: () => Promise<any>, kind: string, title: string}}>} */
export class Donut extends SafetyFirst {
  constructor (props) {
    super(props);
    this.interval = null;
    this.setNode = n => this.setNode_(n);
    this.resize = () => this.node && Plots.resize(this.node);

    this.layout = {
      height: 150,
      minWidth: 150,
      overflow: 'hidden',
      margin: {
        l: 10,
        b: 30,
        r: 10,
        t: 20,
        pad: 20,
      },
      annotations: [
        {
          font: {
            size: 11
          },
          showarrow: false,
          text: '',
          x: 0.5,
          y: 0.5
        },
      ],
    };

    this.options = {
      staticPlot: true,
    };

    this.style = {};
    this.data = [{
      values: [],
      labels: [],
      hole: .7,
      type: 'pie',
      textposition: 'outside',
      marker: {
        colors: colors['3'],
      },
    }];
  }

  setNode_(node) {
    if (node) {
      this.node = node;
    }
  }

  fetch () {
    this.props.fetch()
      .then((data) => this.updateGraph(data[0], data[1], false))
      .catch(() => this.updateGraph(null, null, true))
      .then(() => this.interval = setTimeout(() => {
        if (this.isMounted_) {
          this.fetch();
        }
      }, 30000));
  }

  componentWillMount () {
    clearInterval(this.interval);
    this.fetch();
    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    window.removeEventListener('resize', this.resize);
    clearInterval(this.interval);
  }

  componentDidMount () {
    super.componentDidMount();

    if (!this.node) {
      return;
    }

    this.layout = _.extend({
      height: 150,
      autosize: true,
    }, this.layout);

    plot(this.node, this.data, this.layout, this.options).catch(e => {
      // eslint-disable-next-line no-console
      console.error('error initializing graph:', e);
    });
  }

  updateGraph (values, labels, err) {
    if (err) {
      this.data[0].values = [];
      this.data[0].labels = [];
      this.layout.annotations[0].text = 'Could not load data';
      this.layout.annotations[0].font.color = '#ccc';
      relayout(this.node, this.layout);
      return;
    }

    this.data[0].values = values;
    this.data[0].labels = labels;

    const colorIndex = Math.min(3, Math.max(values.length, 9));
    this.data[0].marker.colors = colors[colorIndex.toString()];

    if (values.length === 0) {
      this.layout.annotations[0].text = 'No data found';
      this.layout.annotations[0].font.color = '#ccc';
    } else {
      this.layout.annotations[0].text = `${values.reduce((total, num) => total + num)} ${this.props.kind}`;
      this.layout.annotations[0].font.color = '#000';
    }

    relayout(this.node, this.layout);
  }

  render () {
    return <div className="graph-wrapper" style={this.style}>
      <h5 className="graph-title">{this.props.title}</h5>
      <div ref={this.setNode} style={{width: '100%'}} />
    </div>;
  }
}
