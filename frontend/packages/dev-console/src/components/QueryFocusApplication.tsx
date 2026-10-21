import type { ReactNode, FC } from 'react';
import { useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { setActiveApplication } from '@console/internal/actions/ui';
import { getActiveApplication } from '@console/internal/reducers/ui';
import type { RootState } from '@console/internal/redux';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { QUERY_PROPERTIES } from '../const';

type StateProps = {
  application: string;
};
type DispatchProps = {
  onSetApp: (application: string) => void;
};
type OwnProps = {
  children: (desiredApplication?: string) => ReactNode;
};

type QueryFocusApplicationProps = StateProps & DispatchProps & OwnProps;

const QueryFocusApplication: FC<QueryFocusApplicationProps> = ({
  children,
  application,
  onSetApp,
}) => {
  const originalApp = useRef(application);
  const desiredApplication = new URLSearchParams(window.location.search).get(
    QUERY_PROPERTIES.APPLICATION,
  );

  useEffect(() => {
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
