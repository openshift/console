import * as React from 'react';
import { CheckIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { toggleCloudShellExpanded } from '../../redux/actions/cloud-shell-actions';
import { isCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import useCloudShellAvailable from './useCloudShellAvailable';

type DispatchProps = {
  onClick: () => void;
};

type StateProps = {
  open?: boolean;
};

type Props = StateProps & DispatchProps & { className?: string };

const ClouldShellMastheadAction: React.FC<Props> = ({ onClick, className, open }) => {
  const terminalAvailable = useCloudShellAvailable();
  const { t } = useTranslation();
  if (!terminalAvailable) {
    return null;
  }
  return (
    <button
      className={className}
      type="button"
      onClick={onClick}
      data-tour-id="tour-cloud-shell-button"
      data-quickstart-id="qs-masthead-cloudshell"
    >
      {t('cloudshell~OpenShift command line')}
      {open ? (
        <span
          style={{
            marginLeft: 'auto',
            color: 'var(--pf-global--active-color--100)',
            fontSize: 'var(--pf-global--FontSize--xs)',
            paddingLeft: 'var(--pf-global--spacer--md)',
          }}
        >
          <CheckIcon />
        </span>
      ) : null}
    </button>
  );
};

const stateToProps = (state: RootState): StateProps => ({
  open: isCloudShellExpanded(state),
});

const dispatchToProps = (dispatch): DispatchProps => ({
  onClick: () => dispatch(toggleCloudShellExpanded()),
});

export default connect<StateProps, DispatchProps>(
  stateToProps,
  dispatchToProps,
)(ClouldShellMastheadAction);
