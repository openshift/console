import * as React from 'react';
import {
  Alert,
  Checkbox,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateFooter,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import classnames from 'classnames';
import { Trans, useTranslation } from 'react-i18next';
import { coFetch } from '@console/internal/co-fetch';
import {
  ExternalLink,
  getQueryArgument,
  LoadingBox,
  LoadingInline,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';
import { modelFor, NodeKind, resourceURL } from '@console/internal/module/k8s';
import { useUserSettings } from '@console/shared';
import { LOG_WRAP_LINES_USERSETTINGS_KEY } from '@console/shared/src/constants';
import NodeLogsFilterUnit from './NodeLogsUnitFilter';
import './node-logs.scss';

type NodeLogsProps = {
  obj: NodeKind;
};

type LogControlsProps = {
  onTogglePath: () => void;
  onChangePath: (event: React.ChangeEvent<HTMLInputElement>, newAPI: string) => void;
  path: string;
  isPathOpen: boolean;
  pathItems: string[];
  isJournal: boolean;
  onChangeUnit: (value: string) => void;
  unit: string;
  isLoadingFilenames: boolean;
  logFilenamesExist: boolean;
  onToggleFilename: () => void;
  onChangeFilename: (event: React.ChangeEvent<HTMLInputElement>, newFilename: string) => void;
  logFilename: string;
  isFilenameOpen: boolean;
  logFilenames: string[];
  isWrapLines: boolean;
  setWrapLines: (wrapLines: boolean) => void;
  showSearch: boolean;
};

const LogControls: React.FC<LogControlsProps> = ({
  onTogglePath,
  onChangePath,
  path,
  isPathOpen,
  pathItems,
  isJournal,
  onChangeUnit,
  unit,
  isLoadingFilenames,
  logFilenamesExist,
  onToggleFilename,
  onChangeFilename,
  logFilename,
  isFilenameOpen,
  logFilenames,
  isWrapLines,
  setWrapLines,
  showSearch,
}) => {
  const options = (items) =>
    items.map((value) => {
      return (
        <SelectOption
          key={value}
          value={value}
          className={classnames({ 'co-node-logs__log-select-option': value.length > 50 })}
        >
          {value}
        </SelectOption>
      );
    });
  const { t } = useTranslation();

  return (
    <Toolbar className="co-toolbar-empty-state">
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>
            <Select
              onSelect={onChangePath}
              selected={path}
              isOpen={isPathOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={onTogglePath}
                  aria-label={t('public~Select a path')}
                  data-test="select-path"
                >
                  {path}
                </MenuToggle>
              )}
            >
              <SelectList>{options(pathItems)}</SelectList>
            </Select>
          </ToolbarItem>
          {isJournal && <NodeLogsFilterUnit onChangeUnit={onChangeUnit} unit={unit} />}
          {!isJournal && (
            <ToolbarItem>
              {isLoadingFilenames ? (
                <LoadingInline />
              ) : (
                logFilenamesExist && (
                  <Select
                    onSelect={onChangeFilename}
                    selected={logFilename}
                    isOpen={isFilenameOpen}
                    className="co-node-logs__log-select"
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={onToggleFilename}
                        data-test="select-file"
                      >
                        {logFilename || t('public~Select a log file')}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>{options(logFilenames)}</SelectList>
                  </Select>
                )
              )}
            </ToolbarItem>
          )}
          {showSearch && (
            <ToolbarItem>
              <LogViewerSearch placeholder={t('public~Search')} minSearchChars={0} />
            </ToolbarItem>
          )}
        </ToolbarGroup>
        <ToolbarItem className="pf-v6-u-flex-fill pf-v6-u-align-self-center pf-v6-u-justify-content-flex-end">
          <Checkbox
            label={t('public~Wrap lines')}
            id="wrapLogLines"
            isChecked={isWrapLines}
            data-checked-state={isWrapLines}
            onChange={(_event, checked: boolean) => {
              setWrapLines(checked);
            }}
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

const NodeLogs: React.FC<NodeLogsProps> = ({ obj: node }) => {
  const {
    kind,
    metadata: { labels, name, namespace: ns },
    status,
  } = node;
  const isWindows = status?.nodeInfo?.operatingSystem === 'windows';
  const pathItems = ['journal'];
  isWindows
    ? pathItems.push('containers', 'hybrid-overlay', 'kube-proxy', 'kubelet', 'containerd', 'wicd')
    : labels['node-role.kubernetes.io/master'] === '' &&
      pathItems.push('openshift-apiserver', 'kube-apiserver', 'oauth-apiserver');
  const pathQueryArgument = 'path';
  const unitQueryArgument = 'unit';
  const logQueryArgument = 'log';

  const [path, setPath] = React.useState(getQueryArgument(pathQueryArgument) || pathItems[0]);
  const [logURL, setLogURL] = React.useState('');
  const [logFilenames, setLogFilenames] = React.useState([]);
  const [unit, setUnit] = React.useState(getQueryArgument(unitQueryArgument));
  const [logFilename, setLogFilename] = React.useState(getQueryArgument(logQueryArgument));
  const [isLoadingLog, setLoadingLog] = React.useState(true);
  const [isLoadingFilenames, setLoadingFilenames] = React.useState(true);
  const [error, setError] = React.useState('');
  const [isPathOpen, setPathOpen] = React.useState(false);
  const [isFilenameOpen, setFilenameOpen] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [isWrapLines, setWrapLines] = useUserSettings<boolean>(
    LOG_WRAP_LINES_USERSETTINGS_KEY,
    false,
    true,
  );
  const { t } = useTranslation();

  const isJournal = path === 'journal';

  const fetchLog = React.useCallback(
    (url: string) => {
      coFetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          setContent(responseText);
          setLoadingLog(false);
          setError('');
        })
        .catch((e) => {
          setLoadingLog(false);
          setError(t('public~Error fetching logs: {{message}}', { message: e.message }));
        });
    },
    [t],
  );
  const getUnitQueryParams = (unitText: string) => {
    const unitsArray = unitText?.split(',');
    const unitQueryParams = unitsArray?.map((val) => `unit=${val}`);
    return unitQueryParams?.join('&');
  };
  const getLogURL = React.useCallback(
    (ext?: string, unitText?: string) => {
      const baseURL = `proxy/logs/${path}`;
      let extendedURL;
      if (ext) {
        extendedURL = `${baseURL}${ext}`;
      }
      if (unitText) {
        extendedURL = `${baseURL}?${getUnitQueryParams(unitText)}`;
      }
      return resourceURL(modelFor(kind), {
        name,
        ns,
        path: extendedURL || baseURL,
      });
    },
    [kind, name, ns, path],
  );

  React.useEffect(() => {
    if (!path || isJournal) {
      const journalLogURL = getLogURL('', unit);
      setLogURL(journalLogURL);
    } else {
      if (path && logFilename) {
        const logFilenameURL = getLogURL(`/${logFilename}`);
        setLogURL(logFilenameURL);
      }
      coFetch(getLogURL())
        .then((response) => response.text())
        .then((responseText) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(responseText, 'text/html');
          const links = !isWindows
            ? doc.querySelectorAll('a[href^="audit"]')
            : doc.querySelectorAll('a');
          const filenames = [];
          for (const link of links) {
            filenames.push(link.textContent);
          }
          setLogFilenames(filenames);
          setLoadingFilenames(false);
        })
        .catch((e) => {
          setLoadingLog(false);
          setLoadingFilenames(false);
          setError(t('public~Error fetching log filenames: {{message}}', { message: e.message }));
        });
    }
  }, [kind, name, ns, path, isJournal, isWindows, logFilename, getLogURL, t, unit]);

  React.useEffect(() => {
    if (logURL) {
      fetchLog(logURL);
    }
  }, [logURL, fetchLog]);

  let trimmedContent = '';
  const MAX_LENGTH = 500000;
  if (content.length > MAX_LENGTH) {
    const index = content.indexOf('\n', content.length - MAX_LENGTH);
    trimmedContent = content.substr(index + 1);
  }

  const onChangePath = (event: React.ChangeEvent<HTMLInputElement>, newAPI: string) => {
    event.preventDefault();
    setPathOpen(false);
    setPath(newAPI);
    setLogFilenames([]);
    setLogFilename('');
    setUnit('');
    setQueryArgument(pathQueryArgument, newAPI);
    removeQueryArgument(unitQueryArgument);
    removeQueryArgument(logQueryArgument);
    setLoadingFilenames(true);
    setLoadingLog(true);
    trimmedContent = '';
  };
  const onTogglePath = () => setPathOpen(!isPathOpen);
  const onChangeUnit = (value: string) => {
    setUnit(value);
    value === ''
      ? removeQueryArgument(unitQueryArgument)
      : setQueryArgument(unitQueryArgument, value);
  };
  const onChangeFilename = (event: React.ChangeEvent<HTMLInputElement>, newFilename: string) => {
    event.preventDefault();
    setFilenameOpen(false);
    setLogFilename(newFilename);
    setLoadingLog(true);
    setQueryArgument(logQueryArgument, newFilename);
    setLogURL(getLogURL(`/${newFilename}`));
    fetchLog(getLogURL(`/${newFilename}`));
    trimmedContent = '';
  };
  const onToggleFilename = () => setFilenameOpen(!isFilenameOpen);
  const errorExists = error.length > 0;
  const logFilenamesExist = logFilenames.length > 0;

  const logControls = (
    <LogControls
      onTogglePath={onTogglePath}
      onChangePath={onChangePath}
      path={path}
      isPathOpen={isPathOpen}
      pathItems={pathItems}
      isJournal={isJournal}
      onChangeUnit={onChangeUnit}
      unit={unit}
      isLoadingFilenames={isLoadingFilenames}
      logFilenamesExist={logFilenamesExist}
      onToggleFilename={onToggleFilename}
      onChangeFilename={onChangeFilename}
      logFilename={logFilename}
      isFilenameOpen={isFilenameOpen}
      logFilenames={logFilenames}
      isWrapLines={isWrapLines}
      setWrapLines={setWrapLines}
      showSearch={!isLoadingLog && !errorExists}
    />
  );

  return (
    <div className="co-m-pane__body co-m-pane__body--full-height">
      <div className="log-window-wrapper">
        {(isLoadingLog || errorExists) && logControls}
        {trimmedContent?.length > 0 && !isLoadingLog && (
          <Alert
            isInline
            className="co-alert co-alert--margin-bottom-sm"
            variant="warning"
            title={t('public~The log is abridged due to length.')}
          >
            <Trans ns="public" t={t}>
              To view unabridged log content,{' '}
              <ExternalLink href={logURL}>open the raw file in another window</ExternalLink>.
            </Trans>
          </Alert>
        )}
        {isLoadingLog ? (
          !isJournal && !logFilename ? (
            <EmptyState
              headingLevel="h2"
              titleText={
                <>
                  {isLoadingFilenames ? (
                    <LoadingInline />
                  ) : logFilenamesExist ? (
                    t('public~No log file selected')
                  ) : (
                    t('public~No log files exist')
                  )}
                </>
              }
              variant={EmptyStateVariant.full}
              isFullHeight
            >
              <EmptyStateFooter>
                {logFilenamesExist && (
                  <EmptyStateBody>{t('public~Select a log file above')}</EmptyStateBody>
                )}
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <LoadingBox />
          )
        ) : errorExists ? (
          <Alert variant="danger" isInline title={error} className="co-alert" />
        ) : (
          <LogViewer
            isTextWrapped={isWrapLines}
            data={trimmedContent || content}
            toolbar={logControls}
            theme="dark"
            initialIndexWidth={7}
          />
        )}
      </div>
    </div>
  );
};

export default NodeLogs;
