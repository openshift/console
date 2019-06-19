import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import {
  ALL_NAMESPACES_KEY,
  ALL_APPLICATIONS_KEY,
  APPLICATION_LOCAL_STORAGE_KEY,
} from '@console/internal/const';
import { setActiveApplication } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace, getActiveApplication } from '@console/internal/reducers/ui';
import ApplicationDropdown from './ApplicationDropdown';

interface ApplicationSelectorProps {
  namespace: string;
  application: string;
  onChange: (name: string) => void;
}

const ApplicationSelector: React.FC<ApplicationSelectorProps> = ({
  namespace,
  application,
  onChange,
}) => {
  const onApplicationChange = (newApplication: string, key: string) => {
    key === ALL_APPLICATIONS_KEY ? onChange(key) : onChange(newApplication);
  };
  const allApplicationsTitle = 'all applications';

  const disabled = namespace === ALL_NAMESPACES_KEY;

  let title: string = application;
  if (disabled) {
    title = 'No applications';
  } else if (title === ALL_APPLICATIONS_KEY) {
    title = allApplicationsTitle;
  }

  return (
    <ApplicationDropdown
      className="co-namespace-selector"
      menuClassName="co-namespace-selector__menu dropdown-menu--right"
      buttonClassName="btn-link"
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

const mapStateToProps = (state: RootState) => ({
  namespace: getActiveNamespace(state),
  application: getActiveApplication(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onChange: (app: string) => {
    dispatch(setActiveApplication(app));
  },
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ApplicationSelector);
