import * as React from 'react';
import * as PropTypes from 'prop-types';
import { plot, Plots } from 'plotly.js/lib/core';

import { coFetchJSON } from '../../co-fetch';

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
      height: 250,
      margin: {
        l: 40,
        b: 30,
        r: 10,
        t: 10,
        pad: 10,
      },
      autosize: true,
    };
    this.defaultOptions = {};
    this.timeSpan = this.props.timeSpan || 60 * 60 * 1000; // 1 hour
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

    const pollInterval = this.timeSpan ? this.timeSpan / 120 : 15000;
    const stepSize = pollInterval / 1000;
    const promises = queries.map(q => {
      const url = this.timeSpan
        ? `${basePath}/api/v1/query_range?query=${encodeURIComponent(q.query)}&start=${start / 1000}&end=${end / 1000}&step=${stepSize}`
        : `${basePath}/api/v1/query?query=${encodeURIComponent(q.query)}`;
      return coFetchJSON(url);
    });
    Promise.all(promises)
      .then(values => this.update(values))
      .catch(e => console.error(e))
      .then(() => {
        if (this.isMounted_) {
          return;
        }
        this.interval = setTimeout(() => this.fetch(), pollInterval);
      });
  }

  componentWillMount() {
    this.fetch();
    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount () {
    this.isMounted_ = true;
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
    return <div style={Object.assign({}, {border: '1px solid #ddd', borderRadius: 8, padding: 15, margin: '8px 0'}, this.style)} >
      { title && <h4 style={{fontWeight: 'bold', margin: 0, textAlign: 'center', color: '#444'}}>{title}</h4> }
      <div ref={this.setNode} />
    </div>;
  }
}

BaseGraph.PropTypes = {
  query: PropTypes.string.isRequired,
  title: PropTypes.string,
};
