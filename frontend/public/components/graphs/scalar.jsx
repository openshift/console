import * as React from 'react';

import { SafetyFirst } from '../safety-first';

const colors = {
  ok: 'rgb(57,200,143)',
  warn: 'rgb(245,178,83)',
  error: 'rgb(213,69,89)',
};

export class Scalar extends SafetyFirst {
  constructor (props) {
    super(props);
    this.state = {
      status: '...',
    };
  }

  fetch () {
    this.props.fetch()
      .then(({short, long, status}) => this.setState({short, long, status}))
      .catch(() => this.setState({short: 'BAD', long: 'Error', status: 'ERROR'}))
      .then(() => setTimeout(() => this.fetch(), 30000));
  }

  componentWillMount () {
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
    }
    return <div style={Object.assign({}, {border: '1px solid #ddd', borderRadius: 8, padding: 15, margin: '8px 0', height: 200, backgroundColor: 'rgb(252,252,252)'}, this.style)} >
      { title && <h4 style={{fontWeight: 'bold', margin: 0, textAlign: 'center', color: '#444'}}>{title}</h4> }
      <div className="text-center">
        <h1 style={{color, fontSize: 40, fontWeight: 'bold', padding: '28px 0 0', marginBottom: 0}}>{short}</h1>
        <div className="text-muted" style={{fontSize: 20}}>{long}</div>
      </div>
    </div>;
  }
}
