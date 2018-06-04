import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Heading, CopyToClipboard } from './utils';

export const MaskedData = () => <React.Fragment>
  <span className="sr-only">Value hidden</span>
  <span aria-hidden="true">&bull;&bull;&bull;&bull;&bull;</span>
</React.Fragment>;

export const ConfigMapData = ({data}) => {
  const dl = [];
  Object.keys(data || {}).sort().forEach(k => {
    const value = data[k];
    dl.push(<dt key={`${k}-k`}>{k}</dt>);
    dl.push(<dd key={`${k}-v`}><CopyToClipboard value={value} /></dd>);
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
    Object.keys(data || {}).sort().forEach(k => {
      const value = window.atob(data[k]);
      const visibleValue = showSecret ? value : <MaskedData /> ;
      dl.push(<dt key={`${k}-k`}>{k}</dt>);
      dl.push(<dd key={`${k}-v`}><CopyToClipboard value={value} visibleValue={visibleValue}/></dd>);
    });
    return <React.Fragment>
      <Heading text="Data">
        <button className="btn btn-link" type="button" onClick={this.toggleSecret}>
          {
            showSecret
              ? <React.Fragment><i className="fa fa-eye-slash" aria-hidden="true"></i> Hide Values</React.Fragment>
              : <React.Fragment><i className="fa fa-eye" aria-hidden="true"></i> Reveal Values</React.Fragment>
          }
        </button>
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
