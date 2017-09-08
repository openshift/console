import * as React from 'react';
import * as PropTypes from 'prop-types';
import { plot, Plots } from 'plotly.js/lib/core';

import { coFetchJSON } from '../../co-fetch';

const stepSize = 30; // 30 seconds
// const pollInterval = stepSize * 1000; // stepSize in milliseconds
const basePath = '/api/kubernetes/api/v1/proxy/namespaces/tectonic-system/services/prometheus:9090';

export class BaseGraph extends React.PureComponent {
  constructor(props) {
    super(props);
    this.interval = null;
    this.setNode = n => this.setNode_(n);
    // Child classes set these
    this.data = [];
    this.resize = () => this.node && Plots.resize(this.node);
    this.defaultLayout = {
      margin: {
        l: 40,
        b: 30,
        r: 10,
        t: 10,
        pad: 10,
      },
    };
    this.defaultOptions = {};
    this.timeSpan = 60 * 60 * 1000; // 1 hour
  }

  setNode_(node) {
    if (node) {
      this.node = node;
    }
  }

  fetch () {
    const end = Date.now();
    const start = end - (this.timeSpan);

    let queries = this.props.query;
    if (!_.isArray(queries)) {
      queries = [{
        query: queries,
      }];
    }

    const promises = queries.map(q => coFetchJSON(`${basePath}/api/v1/query_range?query=${encodeURIComponent(q.query)}&start=${start / 1000}&end=${end / 1000}&step=${stepSize}`));
    Promise.all(promises).then(values => {
      this.update(values);
    }).catch(e => console.error(e));
  }

  componentWillMount() {
    this.fetch();
    window.addEventListener('resize', this.resize);
    this.interval = setInterval(() => this.fetch(), 5000);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resize);
    clearInterval(this.interval);
  }

  componentDidMount () {
    this.layout = _.extend(this.defaultLayout, this.layout);
    this.options = _.extend(this.defaultOptions, this.options);
    plot(this.node, this.data, this.layout, this.options).catch(e => {
      console.error('error initializing graph:', e);
    });
  }

  render () {
    const title = this.props.title;
    return <div style={{border: '1px solid #ddd', borderRadius: 8, padding: 8, margin: 8}} >
      { title && <h4 style={{fontWeight: 'bold', margin: 0, textAlign: 'center', color: '#333'}}>{title}</h4> }
      <div ref={this.setNode} />
    </div>;
  }
}

BaseGraph.PropTypes = {
  query: PropTypes.string.isRequired,
  title: PropTypes.string,
};
