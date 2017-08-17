import * as React from 'react';

export class SafetyFirst extends React.Component {
  constructor(props) {
    super(props);
    this.isMounted_ = false;
    this.setState_ = this.setState;
    this.setState = (...args) => this.isMounted_ && this.setState_(...args);
  }

  componentWillUnmount() {
    this.isMounted_ = false;
  }

  componentDidMount() {
    this.isMounted_ = true;
  }
}
