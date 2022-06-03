import * as React from 'react';
import { Button, Tab, TabTitleText, TabTitleIcon } from '@patternfly/react-core';
import { CloseIcon, PlusIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getUser } from '@console/dynamic-plugin-sdk';
import { useAccessReview2 } from '@console/internal/components/utils/rbac';
import { UserKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  useFlag,
  withUserSettingsCompatibility,
  WithUserSettingsCompatibilityProps,
} from '@console/shared';
import { FLAG_V1ALPHA2DEVWORKSPACE } from '../../consts';
import { v1alpha1WorkspaceModel, WorkspaceModel } from '../../models';
import { Tabs } from '../tabs';
import { sendActivityTick, TICK_INTERVAL } from './cloud-shell-utils';
import CloudShellTerminal from './CloudShellTerminal';
import { CLOUD_SHELL_NAMESPACE, CLOUD_SHELL_NAMESPACE_CONFIG_STORAGE_KEY } from './const';
import useCloudShellWorkspace from './useCloudShellWorkspace';
import './MultiTabbedTerminal.scss';

const MAX_TERMINAL_TABS = 8;

type Props = {
  onClose?: () => void;
};

type StateProps = {
  user: UserKind;
};

type MultiTabbedTerminalProps = Props & StateProps;

export const MultiTabbedTerminal: React.FC<MultiTabbedTerminalProps &
  WithUserSettingsCompatibilityProps<string>> = ({
  user,
  userSettingState: namespace,
  setUserSettingState: setNamespace,
  onClose,
}) => {
  const [terminalTabs, setTerminalTabs] = React.useState<number[]>([1]);
  const [activeTabKey, setActiveTabKey] = React.useState<number>(1);
  const { t } = useTranslation();
  const [isAdmin, isAdminCheckLoading] = useAccessReview2({
    namespace: 'openshift-terminal',
    verb: 'create',
    resource: 'pods',
  });
  const isv1Alpha2Available = useFlag(FLAG_V1ALPHA2DEVWORKSPACE);
  const workspaceModel = !isv1Alpha2Available ? v1alpha1WorkspaceModel : WorkspaceModel;
  const [workspace, loaded, loadError] = useCloudShellWorkspace(
    user,
    !isAdminCheckLoading && isAdmin,
    workspaceModel,
    namespace,
  );

  const workspaceName = loaded && !loadError && workspace && workspace?.metadata?.name;

  // const tick = React.useCallback(
  //   () => workspaceName && namespace && sendActivityTick(workspaceName, namespace),
  //   [workspaceName, namespace],
  // );

  // React.useEffect(() => {
  //   let startTime;
  //   let tickReq;
  //   const handleTick = (timestamp) => {
  //     if (!startTime || timestamp - startTime >= TICK_INTERVAL) {
  //       startTime = timestamp;
  //       tick();
  //     }
  //     tickReq = window.requestAnimationFrame(handleTick);
  //   };

  //   tickReq = window.requestAnimationFrame(handleTick);

  //   console.log(handleTick);

  //   return () => {
  //     window.cancelAnimationFrame(tickReq);
  //   };
  // }, [tick]);

  React.useEffect(() => {
    let tick =
      namespace &&
      workspaceName &&
      setInterval(() => {
        sendActivityTick(namespace, workspaceName);
        // eslint-disable-next-line no-console
        console.log('ticking');
      }, TICK_INTERVAL);

    const handleVisibilityChange = () => {
      // eslint-disable-next-line no-console
      console.log('handle vischng');
      if (document.hidden) {
        tick && clearInterval(tick);
      } else {
        tick =
          tick ??
          (namespace &&
            workspaceName &&
            setInterval(() => {
              sendActivityTick(namespace, workspaceName);
              // eslint-disable-next-line no-console
              console.log('ticking');
            }, TICK_INTERVAL));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      tick && clearInterval(tick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [workspaceName, namespace]);

  const addNewTerminal = () => {
    if (terminalTabs.length < MAX_TERMINAL_TABS) {
      const tabs = [...terminalTabs];
      const newTerminalNumber = terminalTabs[terminalTabs.length - 1] + 1;
      tabs.push(newTerminalNumber);
      setTerminalTabs(tabs);
      setActiveTabKey(newTerminalNumber);
    }
  };

  const removeCurrentTerminal = (event, tabIndex: number) => {
    event.stopPropagation();
    const tabs = [...terminalTabs];
    if (tabs[tabIndex] === activeTabKey) {
      setActiveTabKey(tabIndex > 0 ? tabs[tabIndex - 1] : tabs[tabs.length - 1]);
    }
    tabs.splice(tabIndex, 1);
    setTerminalTabs(tabs);
  };

  return (
    <Tabs activeKey={activeTabKey} isBox data-test="multi-tab-terminal">
      {terminalTabs.map((terminalNumber, tabIndex) => (
        <Tab
          translate="no"
          className="co-multi-tabbed-terminal__tab"
          data-test="multi-tab-terminal-tab"
          eventKey={terminalNumber}
          key={terminalNumber}
          title={
            <div>
              <TabTitleText onClick={() => setActiveTabKey(terminalNumber)}>
                {t('console-app~Terminal {{number}}', { number: terminalNumber })}
              </TabTitleText>
              <TabTitleIcon>
                {terminalTabs.length > 1 ? (
                  <Button
                    variant="plain"
                    style={{ padding: '0' }}
                    aria-label={t('console-app~Close terminal tab')}
                    data-test="close-terminal-icon"
                    onClick={(event) => removeCurrentTerminal(event, tabIndex)}
                  >
                    <CloseIcon />
                  </Button>
                ) : (
                  <Button
                    variant="plain"
                    style={{ padding: '0' }}
                    aria-label={t('console-app~Close terminal')}
                    data-test="close-terminal-icon"
                    onClick={onClose}
                  >
                    <CloseIcon />
                  </Button>
                )}
              </TabTitleIcon>
            </div>
          }
        >
          <CloudShellTerminal
            isAdmin={isAdmin}
            isAdminCheckLoading={isAdminCheckLoading}
            user={user}
            isv1Alpha2Available={isv1Alpha2Available}
            namespace={namespace}
            setNamespace={setNamespace}
          />
        </Tab>
      ))}
      {terminalTabs.length < MAX_TERMINAL_TABS && (
        <Tab
          translate="no"
          eventKey="add-tab"
          data-test="add-terminal-tab"
          onClick={addNewTerminal}
          title={
            <TabTitleIcon>
              <Button
                variant="plain"
                style={{ padding: '0' }}
                aria-label={t('console-app~Add new tab')}
                data-test="add-terminal-icon"
              >
                <PlusIcon />
              </Button>
            </TabTitleIcon>
          }
        />
      )}
    </Tabs>
  );
};

const stateToProps = (state: RootState): StateProps => ({
  user: getUser(state),
});

// For testing
export const InternalMultiTabTerminal = MultiTabbedTerminal;

export default connect<StateProps, null, Props>(stateToProps)(
  withUserSettingsCompatibility<
    MultiTabbedTerminalProps & WithUserSettingsCompatibilityProps<string>,
    string
  >(
    CLOUD_SHELL_NAMESPACE_CONFIG_STORAGE_KEY,
    CLOUD_SHELL_NAMESPACE,
  )(MultiTabbedTerminal),
);
