import * as React from 'react';

import { BaseGraph } from './base';
import { units } from '../utils';


export class Scalar extends BaseGraph {
  constructor (props) {
    super(props);
    this.timeSpan = 0;
    this.style = {
      height: 80,
      minWidth: 100,
      overflow: 'hidden',
    };
    this.state = {
      value: null,
    };
  }

  update (result) {
    const value = parseFloat(result[0].data.result[0].value[1], 10);
    if (isNaN(value)) {
      console.error('data is NaN!', result);
      return;
    }
    this.setState({value});
  }

  componentDidMount () {
  }

  render () {
    const { title } = this.props;

    const { value, unit } = units.humanize(this.state.value, this.props.unit, true);
    return <div className="graph-wrapper" style={this.style}>
      { title && <h5 className="graph-title">{title}</h5> }
      <h3 className="text-center" style={{marginTop: 10}}>{ value }<span className="text-muted" style={{fontSize: 14}}>{unit}</span></h3>
    </div>;
  }
}
