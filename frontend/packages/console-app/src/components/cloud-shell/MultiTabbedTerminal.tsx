import * as React from 'react';
import { Tabs, Tab, TabTitleText, TabTitleIcon, Button } from '@patternfly/react-core';
import { CloseIcon, PlusIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import CloudShellTerminal from './CloudShellTerminal';
import './MultiTabbedTerminal.scss';

const MAX_TERMINAL_TABS = 8;

interface MultiTabbedTerminalProps {
  onClose?: () => void;
}

export const MultiTabbedTerminal: React.FC<MultiTabbedTerminalProps> = ({ onClose }) => {
  const [terminalTabs, setTerminalTabs] = React.useState<number[]>([1]);
  const [activeTabKey, setActiveTabKey] = React.useState<number>(1);
  const { t } = useTranslation();

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
    <Tabs activeKey={activeTabKey} isBox>
      {terminalTabs.map((terminalNumber, tabIndex) => (
        <Tab
          className="co-multi-tabbed-terminal__tab"
          translate="no"
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
          <CloudShellTerminal />
        </Tab>
      ))}
      {terminalTabs.length < MAX_TERMINAL_TABS && (
        <Tab
          translate="no"
          eventKey="add-tab"
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

export default MultiTabbedTerminal;
