import { Split, SplitItem } from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons/dist/esm/icons/check-icon';
import { useTranslation } from 'react-i18next';
import { useToggleCloudShellExpanded } from '../../redux/actions/cloud-shell-dispatchers';
import { useIsCloudShellExpanded } from '../../redux/reducers/cloud-shell-selectors';
import { useCloudShellAvailable } from './useCloudShellAvailable';

export const CloudShellMastheadAction: React.FCC<{ className?: string }> = ({ className }) => {
  const terminalAvailable = useCloudShellAvailable();
  const toggleCloudShellExpanded = useToggleCloudShellExpanded();
  const open = useIsCloudShellExpanded();

  const { t } = useTranslation();
  if (!terminalAvailable) {
    return null;
  }
  return (
    <button
      className={className}
      type="button"
      onClick={toggleCloudShellExpanded}
      data-tour-id="tour-cloud-shell-button"
      data-quickstart-id="qs-masthead-cloudshell"
    >
      <Split className="pf-v6-u-w-100">
        <SplitItem isFilled>{t('webterminal-plugin~OpenShift command line')}</SplitItem>
        {open ? (
          <SplitItem>
            <span
              style={{
                color: 'var(--pf-t--global--icon--color--brand--default)',
                fontSize: 'var(--pf-t--global--font--size--xs)',
                paddingLeft: 'var(--pf-t--global--spacer--md)',
              }}
            >
              <CheckIcon />
            </span>
          </SplitItem>
        ) : null}
      </Split>
    </button>
  );
};
