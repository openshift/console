// withPodList is a higher order component that wraps Rows
// with the ability to expand podlist

import React from 'react';

import {PodList} from './pods';

const withPodList = (Row) => {
  return class WithPodList extends React.Component {
    constructor (props) {
      super(props);
      this.state = {open: false};
    }

    onClick_ (e) {
      e.preventDefault();
      this.setState({open: !this.state.open});
    }

    render () {
      const {metadata: {namespace}, spec: {selector}} = this.props;

      return (
        <div onClick={this.onClick_.bind(this)} ref="target">
          <Row {...this.props} />
          {
            this.state.open &&
            <PodList namespace={namespace} selector={selector}></PodList>
          }
        </div>
      );
    }
  }
}

export default withPodList;

