// withPodList is a higher order component that wraps Rows
// with the ability to expand podlist

import React from 'react';
import classnames from 'classnames';

import {PodList} from './pod';

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
        <div onClick={this.onClick_.bind(this)} ref="target" className={classnames({clickable: !!selector})} >
          <Row {...this.props} />
          {
            this.state.open && selector &&
            <PodList namespace={namespace} selector={selector}></PodList>
          }
        </div>
      );
    }
  }
}

export default withPodList;

