import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect, Dispatch } from 'react-redux';
import {
  ALL_NAMESPACES_KEY,
  ALL_APPLICATIONS_KEY,
  UNASSIGNED_APPLICATIONS_KEY,
  APPLICATION_LOCAL_STORAGE_KEY,
} from '@console/shared';
import { setActiveApplication } from '@console/internal/actions/ui';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace, getActiveApplication } from '@console/internal/reducers/ui';
import { UNASSIGNED_LABEL } from '../../const';
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
  const { t } = useTranslation();
  const allApplicationsTitle = t('devconsole~all applications');
  const noApplicationsTitle = UNASSIGNED_LABEL;
  const dropdownTitle: string =
    application === ALL_APPLICATIONS_KEY
      ? allApplicationsTitle
      : application === UNASSIGNED_APPLICATIONS_KEY
      ? noApplicationsTitle
      : application;
  const [title, setTitle] = React.useState<string>(dropdownTitle);
  React.useEffect(() => {
    if (!disabled) {
      setTitle(dropdownTitle);
    }
  }, [disabled, dropdownTitle]);
  if (namespace === ALL_NAMESPACES_KEY) return null;

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
      titlePrefix={t('devconsole~Application')}
      allSelectorItem={{
        allSelectorKey: ALL_APPLICATIONS_KEY,
        allSelectorTitle: allApplicationsTitle,
      }}
      noneSelectorItem={{
        noneSelectorKey: UNASSIGNED_APPLICATIONS_KEY,
        noneSelectorTitle: noApplicationsTitle,
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
