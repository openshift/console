import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Heading } from './utils';

export const ConfigMapData = ({data}) => {
  const dl = [];
  Object.keys(data || {}).sort().forEach(k => {
    dl.push(<dt key={`${k}-k`}>{k}</dt>);
    dl.push(<dd key={`${k}-v`}><pre className="co-pre-wrap">{data[k]}</pre></dd>);
  });

  return <dl>{dl}</dl>;
};

export class SecretData extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { showSecret: false };
    this.toggleSecret = this.toggleSecret.bind(this);
  }

  toggleSecret() {
    this.setState({ showSecret: !this.state.showSecret });
  }

  render() {
    const { data } = this.props;
    const { showSecret } = this.state;
    const dl = [];
    const masked = <React.Fragment>
      <span className="sr-only">value hidden</span>
      <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
    </React.Fragment>;
    Object.keys(data).sort().forEach(k => {
      dl.push(<dt key={`${k}-k`}>{k}</dt>);
      dl.push(<dd key={`${k}-v`}><pre className="co-pre-wrap">{showSecret ? window.atob(data[k]) : masked}</pre></dd>);
    });
    return <React.Fragment>
      <Heading text="Data" >
        <button className="btn btn-link" type="button" onClick={this.toggleSecret}>{showSecret ? 'Hide Values' : 'Reveal Values'}</button>
      </Heading>
      <dl>{dl}</dl>
    </React.Fragment>;
  }
}

SecretData.propTypes = {
  data: PropTypes.object
};

SecretData.defaultProps = {
  data: {}
};
