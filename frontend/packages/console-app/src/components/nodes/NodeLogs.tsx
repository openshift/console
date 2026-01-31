import { useCallback, useContext, useEffect, useState } from 'react';
import type { FC, Ref } from 'react';
import {
  Alert,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  EmptyStateFooter,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Switch,
  Banner,
  SelectProps,
} from '@patternfly/react-core';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import { css } from '@patternfly/react-styles';
import { Trans, useTranslation } from 'react-i18next';
import { coFetch } from '@console/internal/co-fetch';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import { useQueryParamsMutator } from '@console/internal/components/utils/router';
import { LoadingBox, LoadingInline } from '@console/internal/components/utils/status-box';
import { modelFor, NodeKind, resourceURL } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { LOG_WRAP_LINES_USERSETTINGS_KEY } from '@console/shared/src/constants';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import NodeLogsUnitFilter from './NodeLogsUnitFilter';
import './node-logs.scss';

const MAX_LINE_COUNT = 1000;
const MAX_LINE_LENGTH = 500000;

type NodeLogsProps = {
  obj: NodeKind;
};

type LogControlsProps = {
  onTogglePath: () => void;
  onChangePath: SelectProps['onSelect'];
  path: string;
  isPathOpen: boolean;
  setPathOpen: (value: boolean) => void;
  pathItems: string[];
  isJournal: boolean;
  onChangeUnit: (value: string) => void;
  unit: string;
  isLoadingFilenames: boolean;
  logFilenamesExist: boolean;
  onToggleFilename: () => void;
  onChangeFilename: SelectProps['onSelect'];
  setFilenameOpen: (value: boolean) => void;
  logFilename: string;
  isFilenameOpen: boolean;
  logFilenames: string[];
  isWrapLines: boolean;
  setWrapLines: (wrapLines: boolean) => void;
  showSearch: boolean;
};

const LogControls: FC<LogControlsProps> = ({
  onTogglePath,
  onChangePath,
  path,
  isPathOpen,
  setPathOpen,
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
  setFilenameOpen,
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
          className={css({ 'co-node-logs__log-select-option': value.length > 50 })}
        >
          {value}
        </SelectOption>
      );
    });
  const { t } = useTranslation();

  return (
    <Flex>
      <Flex>
        <FlexItem>
          <Select
            onSelect={onChangePath}
            selected={path}
            isOpen={isPathOpen}
            toggle={(toggleRef: Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={onTogglePath}
                aria-label={t('public~Select a path')}
                data-test="select-path"
              >
                {path}
              </MenuToggle>
            )}
            onOpenChange={(open) => setPathOpen(open)}
          >
            <SelectList>{options(pathItems)}</SelectList>
          </Select>
        </FlexItem>
        {isJournal && <NodeLogsUnitFilter onChangeUnit={onChangeUnit} unit={unit} />}
        {!isJournal && (
          <FlexItem>
            {isLoadingFilenames ? (
              <LoadingInline />
            ) : (
              logFilenamesExist && (
                <Select
                  onSelect={onChangeFilename}
                  selected={logFilename}
                  isOpen={isFilenameOpen}
                  className="co-node-logs__log-select"
                  toggle={(toggleRef: Ref<MenuToggleElement>) => (
                    <MenuToggle ref={toggleRef} onClick={onToggleFilename} data-test="select-file">
                      {logFilename || t('public~Select a log file')}
                    </MenuToggle>
                  )}
                  onOpenChange={(open) => setFilenameOpen(open)}
                >
                  <SelectList>{options(logFilenames)}</SelectList>
                </Select>
              )
            )}
          </FlexItem>
        )}
        {showSearch && (
          <FlexItem>
            <LogViewerSearch placeholder={t('public~Search')} minSearchChars={0} />
          </FlexItem>
        )}
      </Flex>
      <FlexItem align={{ default: 'alignLeft', md: 'alignRight' }}>
        <Switch
          label={t('public~Wrap lines')}
          id="wrapLogLines"
          isChecked={isWrapLines}
          data-checked-state={isWrapLines}
          onChange={(_event, checked: boolean) => {
            setWrapLines(checked);
          }}
        />
      </FlexItem>
    </Flex>
  );
};

const HeaderBanner: FC<{ lineCount: number }> = ({ lineCount }) => {
  const { t } = useTranslation('public');
  const count = lineCount === 0 ? lineCount : lineCount - 1;
  const headerText = t('{{count}} line', { count });
  return <Banner>{headerText}</Banner>;
};

const NodeLogs: FC<NodeLogsProps> = ({ obj: node }) => {
  const { getQueryArgument, setQueryArgument, removeQueryArgument } = useQueryParamsMutator();

  const {
    kind,
    metadata: { labels, name, namespace: ns },
    status,
  } = node;
  const isWindows = status?.nodeInfo?.operatingSystem === 'windows';
  const pathItems = ['journal'];
  isWindows
    ? pathItems.push('containers', 'hybrid-overlay', 'kube-proxy', 'kubelet', 'containerd', 'wicd')
    : labels?.['node-role.kubernetes.io/master'] === '' &&
      pathItems.push('openshift-apiserver', 'kube-apiserver', 'oauth-apiserver');
  const pathQueryArgument = 'path';
  const unitQueryArgument = 'unit';
  const logQueryArgument = 'log';

  const [path, setPath] = useState(getQueryArgument(pathQueryArgument) || pathItems[0]);
  const [logURL, setLogURL] = useState('');
  const [logFilenames, setLogFilenames] = useState([]);
  const [unit, setUnit] = useState(getQueryArgument(unitQueryArgument));
  const [logFilename, setLogFilename] = useState(getQueryArgument(logQueryArgument));
  const [isLoadingLog, setLoadingLog] = useState(true);
  const [isLoadingFilenames, setLoadingFilenames] = useState(true);
  const [error, setError] = useState('');
  const [isPathOpen, setPathOpen] = useState(false);
  const [isFilenameOpen, setFilenameOpen] = useState(false);
  const [content, setContent] = useState('');
  const [trimmedContent, setTrimmedContent] = useState('');
  const [lineCount, setLineCount] = useState(0);
  const [isWrapLines, setWrapLines] = useUserSettings<boolean>(
    LOG_WRAP_LINES_USERSETTINGS_KEY,
    false,
    true,
  );
  const { t } = useTranslation();
  const theme = useContext(ThemeContext);

  const isJournal = path === 'journal';

  const fetchLog = useCallback(
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
  const addTailLinesToURL = (url: string) => {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('tailLines', MAX_LINE_COUNT.toString());
    return urlObj.toString();
  };
  const getLogURL = useCallback(
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

  useEffect(() => {
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

  useEffect(() => {
    if (logURL) {
      fetchLog(addTailLinesToURL(logURL));
    }
  }, [logURL, fetchLog]);

  useEffect(() => {
    if (content.length > MAX_LINE_LENGTH) {
      const index = content.indexOf('\n', content.length - MAX_LINE_LENGTH);
      const newTrimmedContent = content.substr(index + 1);
      setTrimmedContent(newTrimmedContent);
      setLineCount(newTrimmedContent.split('\n').length);
    } else {
      setTrimmedContent('');
      setLineCount(content.split('\n').length);
    }
  }, [content]);

  const onChangePath: SelectProps['onSelect'] = (event, newAPI: string) => {
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
  };
  const onTogglePath = () => setPathOpen(!isPathOpen);
  const onChangeUnit = (value: string) => {
    setUnit(value);
    value === ''
      ? removeQueryArgument(unitQueryArgument)
      : setQueryArgument(unitQueryArgument, value);
  };
  const onChangeFilename: SelectProps['onSelect'] = (event, newFilename: string) => {
    event.preventDefault();
    setFilenameOpen(false);
    setLogFilename(newFilename);
    setLoadingLog(true);
    setQueryArgument(logQueryArgument, newFilename);
    setLogURL(getLogURL(`/${newFilename}`));
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
      setPathOpen={setPathOpen}
      isJournal={isJournal}
      onChangeUnit={onChangeUnit}
      unit={unit}
      isLoadingFilenames={isLoadingFilenames}
      logFilenamesExist={logFilenamesExist}
      onToggleFilename={onToggleFilename}
      onChangeFilename={onChangeFilename}
      logFilename={logFilename}
      isFilenameOpen={isFilenameOpen}
      setFilenameOpen={setFilenameOpen}
      logFilenames={logFilenames}
      isWrapLines={isWrapLines}
      setWrapLines={setWrapLines}
      showSearch={!isLoadingLog && !errorExists}
    />
  );

  return (
    <PaneBody fullHeight>
      <div className="log-window-wrapper">
        {(isLoadingLog || errorExists) && logControls}
        {(lineCount >= MAX_LINE_COUNT || trimmedContent?.length > 0) && !isLoadingLog && (
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
            theme={theme}
            initialIndexWidth={7}
            header={<HeaderBanner lineCount={lineCount} />}
          />
        )}
      </div>
    </PaneBody>
  );
};

export default NodeLogs;
