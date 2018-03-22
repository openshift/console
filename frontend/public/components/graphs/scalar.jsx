import * as _ from 'lodash-es';
import * as React from 'react';

import { BaseGraph } from './base';
import { units } from '../utils';

const style = {
  height: 80,
  minWidth: 100,
  overflow: 'hidden',
};

export class Scalar extends BaseGraph {
  constructor (props) {
    super(props);
    this.timeSpan = 0;
    this.state = {
      value: null,
    };
  }

  updateGraph (data, error) {
    const value = parseFloat(_.get(data, '[0].data.result[0].value[1]'), 10);
    if (isNaN(value)) {
      this.setState({error});
      // eslint-disable-next-line no-console
      console.warn(`Graph error: No data from query ${this.props.query}`);
      return;
    }
    this.setState({value, error});
  }

  render () {
    const { value, unit } = units.humanize(this.state.value, this.props.unit, true);
    return <div className="graph-wrapper" style={Object.assign(style, this.props.style)}>
      <h5 className="graph-title">{this.props.title}</h5>
      <h3 className="text-center" style={{marginTop: 10}}>{ value }<span className="text-muted" style={{fontSize: 14}}>{unit}</span></h3>
    </div>;
  }
}
