import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import * as PropTypes from 'prop-types';

import { history, PageHeading } from '../utils';
import { namespaceProptype } from '../../propTypes';
import { connectToFlags, flagPending } from '../../reducers/features';
import { FLAGS } from '@console/shared';

const updateUrlParams = (k, v) => {
  const url = new URL(window.location);
  const sp = new URLSearchParams(window.location.search);
  sp.set(k, v);
  history.push(`${url.pathname}?${sp.toString()}${url.hash}`);
};

const updateKind = kind => updateUrlParams('kind', encodeURIComponent(kind));

class KialiPage_ extends React.PureComponent {
  constructor(props) {
    super(props);
    this.setRef = ref => (this.ref = ref);
    this.onSelectorChange = k => {
      updateKind(k);
      this.ref && this.ref.focus();
    };
  }

  render() {
    const { flags, location, namespace, t } = this.props;

    // if (flagPending(flags.OPENSHIFT) || flagPending(flags.PROJECTS_AVAILABLE)) {
    //     return null;
    // }
    let url = `${document.location.origin}/api/kiali/`;
    return (
      <React.Fragment>
        <div>
          <Helmet>
            <title>Kiali</title>
          </Helmet>
          <PageHeading title="Kiali"></PageHeading>
          {/* <script>parent.location={url}</script> */}
          <iframe style={{ width: '100%', height: '100vh', border: 0 }} src={url} target="_blank" />
        </div>
      </React.Fragment>
    );
  }
}

export const KialiPage = props => <KialiPage_ {...props} />;
// export const KialiPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECT)(KialiPage_)

KialiPage.propTypes = {
  namespace: namespaceProptype,
  location: PropTypes.object.isRequired,
};
