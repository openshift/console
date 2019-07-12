import * as _ from 'lodash-es';
import * as React from 'react';
import * as classnames from 'classnames';
import { Link } from 'react-router-dom';

import { coFetchJSON } from '../../co-fetch';
import { PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH } from '.';

export const errorStatus = err => {
  if (_.get(err.response, 'ok') === false) {
    return {
      short: '?',
      status: '', // Gray
      long: err.message,
    };
  }
  // Generic network error handling.
  return {
    short: 'ERROR',
    long: err.message,
    status: 'ERROR',
  };
};

const fetchQuery = (q, long, namespace) => {
  const nsParam = namespace ? `&namespace=${encodeURIComponent(namespace)}` : '';
  const basePath = namespace ? PROMETHEUS_TENANCY_BASE_PATH : PROMETHEUS_BASE_PATH;
  return coFetchJSON(`${basePath}/api/v1/query?query=${encodeURIComponent(q)}${nsParam}`)
    .then(res => {
      const short = parseInt(_.get(res, 'data.result[0].value[1]'), 10) || 0;
      return {
        short,
        long,
        status: short === 0 ? 'OK' : 'WARN',
      };
    })
    .catch(errorStatus);
};

/** @augments {React.Component<{fetch?: () => Promise<any>, query?: string, title: string, href?: string, rel?: string, target?: string}}>} */
export class Status extends React.Component {
  constructor(props) {
    super(props);
    this.interval = null;
    this.state = {
      status: '...',
    };
    this.clock = 0;
  }

  fetch(props=this.props) {
    const clock = this.clock;
    const promise = props.query ? fetchQuery(props.query, props.name, props.namespace) : props.fetch();

    const ignorePromise = cb => (...args) => {
      if (clock !== this.clock) {
        return;
      }
      cb(...args);
    };
    promise
      .then(ignorePromise(({short, long, status}) => this.setState({short, long, status})))
      .catch(ignorePromise(() => this.setState({short: 'BAD', long: 'Error', status: 'ERROR'})))
      .then(ignorePromise(() => this.interval = setTimeout(() => {
        if (this.isMounted_) {
          this.fetch();
        }
      }, 30000)));
  }

  componentWillReceiveProps(nextProps) {
    if (_.isEqual(nextProps, this.props)) {
      return;
    }
    this.clock += 1;
    // Don't show stale data if we changed the query.
    this.setState({
      'status': '...',
      'short': undefined,
      'long': undefined,
    });
    this.fetch(nextProps);
  }

  componentWillMount() {
    clearInterval(this.interval);
    this.fetch();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const title = this.props.title;
    const { short, long, status } = this.state;
    const shortStatusClassName = classnames('graph-status__short', {
      'graph-status__short--ok': status === 'OK',
      'graph-status__short--warn': status === 'WARN',
      'graph-status__short--error': status === 'ERROR',
    });

    const statusElem = <div className="graph-wrapper graph-wrapper--title-center graph-wrapper--status">
      { title && <h5 className="graph-title">{title}</h5> }
      <div className="graph-status">
        <h1 className={shortStatusClassName}>{short}</h1>
        <div className="graph-status--long">{long}</div>
      </div>
    </div>;
    const linkProps = _.pick(this.props, ['rel', 'target', 'to']);
    if (_.isEmpty(linkProps)) {
      return statusElem;
    }
    return <Link {...linkProps} className="graph-status__link">{statusElem}</Link>;
  }
}
