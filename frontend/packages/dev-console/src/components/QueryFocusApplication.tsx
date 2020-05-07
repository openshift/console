import * as React from 'react';
import { connect } from 'react-redux';
import { setActiveApplication } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux-types';
import { getActiveApplication } from '@console/internal/reducers/ui-selectors';
import { QUERY_PROPERTIES } from '../const';
import { sanitizeApplicationValue } from '../utils/application-utils';

type StateProps = {
  application: string;
};
type DispatchProps = {
  onSetApp: (application: string) => void;
};
type OwnProps = {
  children: (desiredApplication?: string) => React.ReactNode;
};

type QueryFocusApplicationProps = StateProps & DispatchProps & OwnProps;

const QueryFocusApplication: React.FC<QueryFocusApplicationProps> = ({
  children,
  application,
  onSetApp,
}) => {
  const originalApp = React.useRef(application);
  const desiredApplication = new URLSearchParams(window.location.search).get(
    QUERY_PROPERTIES.APPLICATION,
  );

  React.useEffect(() => {
    const originalApplication = originalApp.current;
    const sanitizedApp = sanitizeApplicationValue(desiredApplication);
    if (sanitizedApp && sanitizedApp !== originalApplication) {
      onSetApp(sanitizedApp);
    }

    return () => {
      if (application !== originalApplication) {
        onSetApp(originalApplication);
      }
    };
  }, [desiredApplication, onSetApp, originalApp, application]);

  return <>{children(desiredApplication)}</>;
};

export default connect<StateProps, DispatchProps, OwnProps>(
  (state: RootState): StateProps => ({
    application: getActiveApplication(state),
  }),
  {
    onSetApp: setActiveApplication,
  },
)(QueryFocusApplication);
