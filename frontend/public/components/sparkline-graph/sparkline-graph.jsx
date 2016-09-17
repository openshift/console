import React from 'react';
import d3 from 'd3';
import ReactChart from './react-chart';
import { register } from '../react-wrapper';
import { Loading } from '../utils/status-box';
import units from '../utils/units';
import { tectonicServiceAvailable } from '../utils/tectonic-service-available';

const states = {
  LOADING: 'loading',
  NOTAVAILABLE: 'notavailable',
  TIMEDOUT: 'timedout',
  NODATA: 'nodata',
  BROKEN: 'broken',
  LOADED: 'loaded'
}

class SparklineGraph extends React.Component {
  constructor(props) {
    super(props);

    this.updateInProgress = false;
    this.interval = null;
    this.state = {
      data: [],
      showStats: false,
      sortedValues: [],
      state: states.LOADING
    }
  }

  componentWillMount() {
    this.setState({
      state: states.LOADING
    });
    this.update();
    this.interval = setInterval(this.update.bind(this), 30 * 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
    this.updateInProgress = true;

    tectonicServiceAvailable({
      serviceName: 'prometheus',
      available: this.doUpdate.bind(this),
      unavailable: this.doUnavailable.bind(this)
    });
  }

  doUnavailable() {
    this.updateInProgress = false;
    clearInterval(this.interval);
    this.setState({
      state: states.NOTAVAILABLE
    });
  }

  doUpdate(baseURL) {
    const end = Date.now() / 1000;
    const start = end - (60 * 60); // 1 hour

    $.ajax(baseURL + '/api/v1/query_range?query=' + this.props.query + '&start=' + start + '&end=' + end + '&step=30')
      .done((json) => {
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
      .fail((jqXHR, textStatus) => {
        if (textStatus === 'timeout') {
          this.setState({
            state: states.TIMEDOUT
          });
        }
        this.setState({
          state: states.BROKEN
        });
      })
      .always(() => {
        this.updateInProgress = false;
      });
  }

  updateData(newData) {
    let data = [];
    newData.forEach(function(item) {
      data.push({
        date: item[0],
        value: item[1],
      });
    });

    const sortedValues = _.map(_.sortBy(data, (item) => item.value), 'value');
    this.setState({
      data,
      sortedValues,
      state: states.LOADED
    });
  }

  isState(s) {
    return this.state.state === s;
  }

  toggleStats(value) {
    this.setState({
      showStats: value
    });
  }

  render() {
    return <div className="sparkline">
      <div className="header">
        <span className="title">{this.props.heading}</span>
        <span className="timespan">1h</span>
        { this.isState(states.LOADED)
          ? <i className="data-toggle fa fa-table enabled" onMouseOver={this.toggleStats.bind(this, true)} onMouseOut={this.toggleStats.bind(this, false)}></i>
          : <i className="data-toggle fa fa-table"></i>
        }
      </div>
      <div className="content">
        { this.isState(states.LOADING) && <Loading /> }
        { this.isState(states.NOTAVAILABLE) && <p>Monitoring is not available for this cluster</p> }
        { this.isState(states.TIMEDOUT) && <p><i className="fa fa-question-circle"></i>Request timed out. <a onClick={this.retry.bind(this)}>Retry</a></p> }
        { this.isState(states.NODATA) && <p>No data found</p> }
        { this.isState(states.BROKEN) && <p className="error"><i className="fa fa-ban"></i>Monitoring is misconfigured or broken</p> }
        { this.isState(states.LOADED) && <ReactChart
          data={this.state.data}
          limit={this.props.limit}
          units={this.props.units} /> }
        { this.isState(states.LOADED) &&
          <div className={this.state.showStats ? 'stats in' : 'stats'}>
            <dl>
              <dt>Limit</dt>
              <dd>{this.props.limit ? units.humanize(this.props.limit, this.props.units, true).string : 'None'}</dd>
            </dl>
            <dl>
              <dt>Median</dt>
              <dd>{units.humanize(d3.median(this.state.data, (d) => d.value), this.props.units, true).string}</dd>
            </dl>
            <dl>
              <dt>95th Perc.</dt>
              <dd>{units.humanize(d3.quantile(this.state.sortedValues, 0.95), this.props.units, true).string}</dd>
            </dl>
            <dl>
              <dt>Latest</dt>
              <dd>{units.humanize(this.state.data[this.state.data.length - 1].value, this.props.units, true).string}</dd>
            </dl>
          </div>
        }
      </div>
    </div>;
  }
}
SparklineGraph.propTypes = {
  heading: React.PropTypes.string,
  testState: React.PropTypes.string,
  query: React.PropTypes.string,
  limit: React.PropTypes.number,
  units: React.PropTypes.string
}

register('sparklinegraph', SparklineGraph);
export { SparklineGraph };
