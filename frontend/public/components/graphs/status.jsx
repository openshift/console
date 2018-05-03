import * as _ from 'lodash-es';
import * as React from 'react';

import { SafetyFirst } from '../safety-first';
import { coFetchJSON } from '../../co-fetch';
import { prometheusBasePath } from './index';

const colors = {
  ok: 'rgb(57,200,143)',
  warn: 'rgb(245,178,83)',
  error: 'rgb(213,69,89)',
};


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

const fetchQuery = (q, long) => coFetchJSON(`${prometheusBasePath}/api/v1/query?query=${encodeURIComponent(q)}`)
  .then(res => {
    const short = parseInt(_.get(res, 'data.result[0].value[1]'), 10) || 0;
    return {
      short,
      long,
      status: short === 0 ? 'OK' : 'WARN',
    };
  })
  .catch(errorStatus);

/** @augments {React.Component<{fetch?: () => Promise<any>, query?: string, title: string, href?: string, rel?: string, target?: string}}>} */
export class Status extends SafetyFirst {
  constructor (props) {
    super(props);
    this.interval = null;
    this.state = {
      status: '...',
    };
    this.clock = 0;
  }

  fetch (props=this.props) {
    const clock = this.clock;
    const promise = props.query ? fetchQuery(props.query, props.name) : props.fetch();

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

  componentWillReceiveProps (nextProps) {
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

  componentWillMount () {
    clearInterval(this.interval);
    this.fetch();
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    clearInterval(this.interval);
  }

  render () {
    const title = this.props.title;
    const { short, long, status } = this.state;
    let color = colors.gray;
    if (status === 'OK') {
      color = colors.ok;
    } else if (status === 'ERROR') {
      color = colors.error;
    } else if (status === 'WARN') {
      color = colors.warn;
    }

    const defaultStyle = {
      marginBottom: '30px',
    };

    const statusElem = <div className="graph-wrapper" style={Object.assign({}, defaultStyle, this.style)} >
      { title && <h5 className="graph-title">{title}</h5> }
      <div className="text-center">
        <h1 style={{color, fontSize: 26, marginBottom: 2}}>{short}</h1>
        <div className="text-muted" style={{fontSize: 14, lineHeight: 1.3}}>{long}</div>
      </div>
    </div>;
    const props = _.pick(this.props, ['href', 'rel', 'target']);
    if (_.isEmpty(props)) {
      return statusElem;
    }
    return <a {...props} style={{textDecoration: 'none'}}>{statusElem}</a>;
  }
}
