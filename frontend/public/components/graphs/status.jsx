import * as _ from 'lodash';
import * as React from 'react';

import { SafetyFirst } from '../safety-first';

const colors = {
  ok: 'rgb(57,200,143)',
  warn: 'rgb(245,178,83)',
  error: 'rgb(213,69,89)',
};

/** @augments {React.Component<{fetch: () => Promise<any>, title: string, href?: string, rel?: string, target?: string}}>} */
export class Status extends SafetyFirst {
  constructor (props) {
    super(props);
    this.interval = null;
    this.state = {
      status: '...',
    };
  }

  fetch () {
    this.props.fetch()
      .then(({short, long, status}) => this.setState({short, long, status}))
      .catch(() => this.setState({short: 'BAD', long: 'Error', status: 'ERROR'}))
      .then(() => this.interval = setTimeout(() => {
        if (this.isMounted_) {
          this.fetch();
        }
      }, 30000));
  }

  componentWillMount () {
    super.componentWillUnmount();
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
      padding: 15,
      margin: '8px 0',
      height: 150,
      backgroundColor: 'rgb(252,252,252)',
      overflow: 'hidden',
    };

    const statusElem = <div className="graph-wrapper" style={Object.assign({}, defaultStyle, this.style)} >
      { title && <h5 className="graph-title">{title}</h5> }
      <div className="text-center">
        <h1 style={{color, fontSize: 26, fontWeight: 'semibold', padding: '16px 0 0', marginBottom: 0}}>{short}</h1>
        <div className="text-muted" style={{fontSize: 14}}>{long}</div>
      </div>
    </div>;
    const props = _.pick(this.props, ['href', 'rel', 'target']);
    if (_.isEmpty(props)) {
      return statusElem;
    }
    return <a {...props} style={{textDecoration: 'none'}}>{statusElem}</a>;
  }
}
