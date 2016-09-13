import React from 'react';
import {injectChild} from '../utils';

export class TwoColumns extends React.Component {
  constructor (props) {
    super(props);
    this.bindRef = (ref) => this.list = ref;
    this.state = {selected: undefined};
  }

  onRowClick (selected) {
    this.setState({selected});
  }

  render () {
    const {children} = this.props;

    const List = this.props.list;
    const Child = injectChild(children, this.state.selected);

    return (
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <div className="row">
            <div className="col-md-4 col-sm-6 col-xs-12">
              <div className="co-facet-container--left">
                <div className="co-m-pane__body__top-controls">
                  <input autoFocus={true} type="text" className="form-control" placeholder="Filter by name..." onChange={e => this.list.applyFilter('name', e.target.value)} />
                </div>
                <List ref={ref => this.list = ref} onClickRow={this.onRowClick.bind(this)} selected={this.state.selected} {...this.props} />
              </div>
            </div>
            <div className="col-md-8 col-sm-6 col-xs-12">
              {Child}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

TwoColumns.propTypes = {
  'list': React.PropTypes.func,
};
