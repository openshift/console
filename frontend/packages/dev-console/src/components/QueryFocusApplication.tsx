import * as React from 'react';
import { connect } from 'react-redux';
import { setActiveApplication } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { QUERY_PROPERTIES } from '../const';

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
    if (desiredApplication && desiredApplication !== originalApplication) {
      onSetApp(desiredApplication);
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
