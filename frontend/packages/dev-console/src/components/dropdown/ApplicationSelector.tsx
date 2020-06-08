import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
  ALL_NAMESPACES_KEY,
  ALL_APPLICATIONS_KEY,
  APPLICATION_LOCAL_STORAGE_KEY,
} from '@console/shared';
import { setActiveApplication } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux-types';
import { getActiveNamespace, getActiveApplication } from '@console/internal/reducers/ui-selectors';
import ApplicationDropdown from './ApplicationDropdown';

export interface ApplicationSelectorProps {
  disabled?: boolean;
}

interface StateProps {
  namespace: string;
  application: string;
}

interface DispatchProps {
  onChange: (name: string) => void;
}

type Props = ApplicationSelectorProps & StateProps & DispatchProps;

const ApplicationSelector: React.FC<Props> = ({ namespace, application, onChange, disabled }) => {
  if (namespace === ALL_NAMESPACES_KEY) return null;

  const allApplicationsTitle = 'all applications';
  const title: string = application === ALL_APPLICATIONS_KEY ? allApplicationsTitle : application;

  const onApplicationChange = (newApplication: string, key: string) => {
    key === ALL_APPLICATIONS_KEY ? onChange(key) : onChange(newApplication);
  };

  return (
    <ApplicationDropdown
      className="co-namespace-selector"
      menuClassName="co-namespace-selector__menu"
      buttonClassName="pf-m-plain"
      namespace={namespace}
      title={title && <span className="btn-link__title">{title}</span>}
      titlePrefix="Application"
      allSelectorItem={{
        allSelectorKey: ALL_APPLICATIONS_KEY,
        allSelectorTitle: allApplicationsTitle,
      }}
      selectedKey={application || ALL_APPLICATIONS_KEY}
      onChange={onApplicationChange}
      storageKey={APPLICATION_LOCAL_STORAGE_KEY}
      disabled={disabled}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
  application: getActiveApplication(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onChange: (app: string) => {
    dispatch(setActiveApplication(app));
  },
});

export default connect<StateProps, DispatchProps, ApplicationSelectorProps>(
  mapStateToProps,
  mapDispatchToProps,
)(ApplicationSelector);
