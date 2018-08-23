import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as _ from 'lodash-es';

import { CopyToClipboard, EmptyBox, SectionHeading } from './utils';

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
  return dl.length ? <dl>{dl}</dl> : <EmptyBox label="Data" />;
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

  getValue(rawValue) {
    if (_.isNil(rawValue)) {
      return <span className="text-muted">No value</span>;
    }

    const { showSecret } = this.state;
    const decodedValue = window.atob(rawValue);
    const visibleValue = showSecret ? decodedValue : <MaskedData />;
    return <CopyToClipboard value={decodedValue} visibleValue={visibleValue} />;
  }

  render() {
    const { data } = this.props;
    const { showSecret } = this.state;
    const dl = [];
    Object.keys(data || {}).sort().forEach(k => {
      const value = this.getValue(data[k]);
      dl.push(<dt key={`${k}-k`}>{k}</dt>);
      dl.push(<dd key={`${k}-v`}>{value}</dd>);
    });
    return <React.Fragment>
      <SectionHeading text="Data">
        {dl.length
          ? <button className="btn btn-link" type="button" onClick={this.toggleSecret}>
            {showSecret
              ? <React.Fragment><i className="fa fa-eye-slash" aria-hidden="true"></i> Hide Values</React.Fragment>
              : <React.Fragment><i className="fa fa-eye" aria-hidden="true"></i> Reveal Values</React.Fragment>}
          </button>
          : null}
      </SectionHeading>
      {dl.length ? <dl>{dl}</dl> : <EmptyBox label="Data" />}
    </React.Fragment>;
  }
}

SecretData.propTypes = {
  data: PropTypes.object
};

SecretData.defaultProps = {
  data: {}
};
