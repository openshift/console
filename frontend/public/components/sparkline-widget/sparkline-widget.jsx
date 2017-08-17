// The overall wrapping component for sparklines.
// This handles the data, headings, and statistics, while passing
// on the actual chart rendering to other classes. This could make
// way for there to be multiple ways to display the same
// data/widget (such as a bar graph instead of lines)

import * as React from 'react';
import * as d3 from 'd3';
import ReactChart from './react-chart';
import { Loading, units } from '../utils';
import { discoverService } from '../../module/k8s';
import { coFetch, coFetchJSON, coFetchUtils } from '../../co-fetch';
import { SafetyFirst } from '../safety-first';

const states = {
  LOADING: 'loading',
  NOTAVAILABLE: 'notavailable',
  TIMEDOUT: 'timedout',
  NODATA: 'nodata',
  BROKEN: 'broken',
  LOADED: 'loaded'
};

const stepSize = 30; // 30 seconds
const timespan = 60 * 60 * 1000; // 1 hour
const pollInterval = stepSize * 1000; // stepSize in milliseconds

export class SparklineWidget extends SafetyFirst {
  constructor(props) {
    super(props);
    this.interval = null;
    this.pollOnNextUpdate = false;
    this.generation = 0;
    this.retry = this.retry.bind(this);
    this.setShowStats = this.setShowStats.bind(this);
    this.initialize();
  }

  initialize(props = this.props) {
    this.updateInProgress = false;
    const newState = _.defaults({}, props, {
      data: [],
      presentationData: [],
      limitQuery: undefined,
      limitText: 'limit',
      showStats: false,
      sortedValues: [],
      state: states.LOADING
    });

    if (this.isMounted_) {
      this.setState(newState);
    } else {
      this.state = newState;
    }
  }

  componentWillMount() {
    this.setState({
      state: states.LOADING
    });
    this.update();
    this.interval = setInterval(this.update.bind(this), pollInterval);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    clearInterval(this.interval);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.query === this.state.query) {
      this.setState(nextProps);
      return;
    }
    this.generation = this.generation + 1; // invalidate any previously running requests
    this.pollOnNextUpdate = true;
    this.initialize(nextProps);
  }

  componentDidUpdate() {
    if (!this.pollOnNextUpdate) {
      return;
    }
    this.pollOnNextUpdate = false;
    this.update();
  }

  // UX: when a user clicks "retry", it's possible that we'll
  // have a response immediately (< 100ms). While this is good
  // for performance, the user won't see the loading state,
  // which may lead them to believe their "retry" action didn't
  // actually do any work.
  // Adding a brief delay alleviates this
  retry() {
    this.setState({
      state: states.LOADING
    });

    setTimeout(this.update.bind(this), 300);
  }

  update() {
    if (this.updateInProgress) {
      // prevent pile-ups
      return;
    }
    this.generation = this.generation + 1;
    this.updateInProgress = true;

    discoverService({
      namespace: 'tectonic-system',
      labelSelector: 'name=prometheus',
      healthCheckPath: '/metrics',
      available: this.doUpdate.bind(this, this.generation),
      unavailable: this.doUnavailable.bind(this, this.generation)
    });
  }

  doUnavailable(generation) {
    if (generation !== this.generation) {
      // this is an old request, ignore it
      return;
    }

    this.updateInProgress = false;
    this.setState({
      state: states.NOTAVAILABLE
    });
  }

  doUpdate(generation, basePath) {
    if (generation !== this.generation) {
      // this is an old request, ignore it
      return;
    }

    if(this.state.limitQuery) {
      const parseLimit = (json) => _.toInteger(_.get(json, 'data.result[0].value[1]', undefined));

      coFetchJSON(`${basePath}/api/v1/query?query=${this.state.limitQuery}`)
        .then(parseLimit)
        .then(limit => this.setState({limit: limit}))
        .catch(() => this.setState({limit: undefined}));
    }

    const end = Date.now();
    const start = end - (timespan);

    coFetch(`${basePath}/api/v1/query_range?query=${encodeURIComponent(this.state.query)}&start=${start / 1000}&end=${end / 1000}&step=${stepSize}`)
      .then((response) => {
        this.updateInProgress = false;
        return response;
      })
      .then(coFetchUtils.parseJson)
      .then((json) => {
        if (!this.isMounted_ || generation !== this.generation) {
          return;
        }

        if (json.status !== 'success') {
          this.setState({
            state: states.BROKEN
          });
          return;
        }
        if (json.data.result.length < 1 || json.data.result[0].values < 1) {
          this.setState({
            state: states.NODATA
          });
          return;
        }
        this.updateData(json.data.result[0].values);
      })
      .catch(() => {
        if (!this.isMounted_ || generation !== this.generation) {
          return;
        }

        // TODO(stuart): whatwg-fetch specifies timeout as a possible
        // termination reason, however fetch() hasn't implemented it.
        // Once that's made available, re-enable our TIMEDOUT state
        // https://fetch.spec.whatwg.org/#responses
        // if (error.message === 'timeout') {
        //   this.setState({
        //     state: states.TIMEDOUT
        //   });
        // }

        this.setState({
          state: states.BROKEN
        });
      });
  }

  updateData(newData) {
    const data = newData.map((item) => {
      return {
        date: item[0],
        value: item[1],
      };
    });

    // make sure gaps in our data aren't smoothed
    let presentationData = [
      data[0]
    ];
    data.slice(1).forEach((current, index) => {
      const previous = data[index]; // this loop starts at 0, so data[index] is previous
      if (current.date - previous.date >= stepSize * 1.1) {
        presentationData.push({
          date: previous.date + 1,
          value: -1
        });
        presentationData.push({
          date: current.date - 1,
          value: -1
        });
      }
      presentationData.push(current);
    });

    const sortedValues = _.map(_.sortBy(data, (item) => item.value), 'value');
    this.setState({
      data,
      presentationData,
      sortedValues,
      state: states.LOADED
    });
  }

  isState(s) {
    return this.state.state === s;
  }

  setShowStats(event) {
    this.setState({
      showStats: event.type === 'mouseover'
    });
  }

  render() {
    return <div className="co-sparkline">
      <div className="widget__header">
        <span className="widget__title">{this.state.heading}</span>
        <span className="widget__timespan">1h</span>
        { this.isState(states.LOADED)
          ? <i className="widget__data-toggle fa fa-table widget__data-toggle--enabled" onMouseOver={this.setShowStats} onMouseOut={this.setShowStats}></i>
          : <i className="widget__data-toggle fa fa-table"></i>
        }
      </div>
      <div className="widget__content">
        { this.isState(states.LOADING) && <Loading /> }
        { this.isState(states.NOTAVAILABLE) && <p className="widget__text">Monitoring is not available for this cluster</p> }
        { this.isState(states.TIMEDOUT) && <p className="widget__text"><i className="fa fa-question-circle"></i>Request timed out. <a className="widget__link" onClick={this.retry}>Retry</a></p> }
        { this.isState(states.NODATA) && <p className="widget__text">No data found</p> }
        { this.isState(states.BROKEN) && <p className="widget__text widget__text--error"><i className="fa fa-ban"></i>Monitoring is misconfigured or broken</p> }
        { this.isState(states.LOADED) && <ReactChart
          data={this.state.presentationData}
          limit={this.state.limit}
          limitText={this.state.limitText}
          units={this.state.units}
          timespan={timespan} /> }
        { this.isState(states.LOADED) &&
          <div className={this.state.showStats ? 'stats stats--in' : 'stats'}>
            <dl className="stats__item">
              <dt className="stats__item-title">{_.capitalize(this.state.limitText)}</dt>
              <dd className="stats__item-value">{this.state.limit ? units.humanize(this.state.limit, this.state.units, true).string : 'None'}</dd>
            </dl>
            <dl className="stats__item">
              <dt className="stats__item-title">Median</dt>
              <dd className="stats__item-value">{units.humanize(d3.median(this.state.sortedValues), this.state.units, true).string}</dd>
            </dl>
            <dl className="stats__item">
              <dt className="stats__item-title">95th %</dt>
              <dd className="stats__item-value">{units.humanize(d3.quantile(this.state.sortedValues, 0.95), this.state.units, true).string}</dd>
            </dl>
            <dl className="stats__item">
              <dt className="stats__item-title">Latest</dt>
              <dd className="stats__item-value">{units.humanize(this.state.data[this.state.data.length - 1].value, this.state.units, true).string}</dd>
            </dl>
          </div>
        }
      </div>
    </div>;
  }
}
SparklineWidget.propTypes = {
  heading: React.PropTypes.string,
  query: React.PropTypes.string,
  limit: React.PropTypes.number,
  limitQuery: React.PropTypes.string,
  limitText: React.PropTypes.string,
  units: React.PropTypes.string
};
