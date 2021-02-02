import * as _ from 'lodash-es';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import { PageHeading } from '../utils';
import { namespaceProptype } from '../../propTypes';
import { connectToFlags } from '../../reducers/features';
import { FLAGS } from '@console/shared/src/constants';

class KibanaPage_ extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setRef = ref => (this.ref = ref);
  }

  render() {
    const { flags, location, namespace, t } = this.props;

    let url = `${document.location.origin}/api/kibana/`;
    return (
      <React.Fragment>
        <div>
          <iframe style={{ width: '100%', height: '100vh', border: 0 }} src={url} target="_blank" />
        </div>
      </React.Fragment>
    );
  }
}
export const KibanaPage = props => <KibanaPage_ {...props} />;

KibanaPage.propTypes = {
  namespace: namespaceProptype,
  location: PropTypes.object.isRequired,
};
