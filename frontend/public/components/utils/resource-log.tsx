import * as React from 'react';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
  ReactNode,
  useMemo,
  Ref,
} from 'react';
import { useSelector } from 'react-redux';
import { Base64 } from 'js-base64';
import * as _ from 'lodash-es';
import { Trans, useTranslation } from 'react-i18next';
import {
  Alert,
  AlertActionLink,
  Banner,
  BannerStatus,
  Button,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
  Tooltip,
} from '@patternfly/react-core';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import {
  CompressIcon,
  ExpandIcon,
  DownloadIcon,
  OutlinedWindowRestoreIcon,
  OutlinedPlayCircleIcon,
  CogIcon,
  SearchIcon,
  BugIcon,
} from '@patternfly/react-icons';
import { css } from '@patternfly/react-styles';
import {
  FLAGS,
  LOG_WRAP_LINES_USERSETTINGS_KEY,
  SHOW_FULL_LOG_USERSETTINGS_KEY,
} from '@console/shared/src/constants';
import { useUserSettings } from '@console/shared';
import { ThemeContext } from '@console/internal/components/ThemeProvider';
import { Loading, TogglePlay } from './';
import { ExternalLinkButton } from '@console/shared/src/components/links/ExternalLinkButton';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { modelFor, resourceURL } from '../../module/k8s';
import { WSFactory } from '../../module/ws-factory';
import { useFullscreen } from '@console/shared/src/hooks/useFullscreen';
import { RootState } from '@console/internal/redux';
import { k8sGet, k8sList, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { ConsoleExternalLogLinkModel, ProjectModel } from '@console/internal/models';
import { useFlag } from '@console/shared/src/hooks';
import { usePrevious } from '@console/shared/src/hooks/previous';
import { resourcePath } from './resource-link';
import { isWindowsPod } from '../../module/k8s/pods';
import { getImpersonate } from '@console/dynamic-plugin-sdk';
import useToggleLineBuffer from './useToggleLineBuffer';

export const STREAM_EOF = 'eof';
export const STREAM_LOADING = 'loading';
export const STREAM_PAUSED = 'paused';
export const STREAM_ACTIVE = 'streaming';

export const LOG_SOURCE_RESTARTING = 'restarting';
export const LOG_SOURCE_RUNNING = 'running';
export const LOG_SOURCE_TERMINATED = 'terminated';
export const LOG_SOURCE_WAITING = 'waiting';

const LOG_TYPE_CURRENT = 'current';
const LOG_TYPE_PREVIOUS = 'previous';

const DEFAULT_BUFFER_SIZE = 1000;

// Messages to display for corresponding log status
const streamStatusMessages = {
  // t('Log stream ended.')
  [STREAM_EOF]: 'Log stream ended.',
  // t('Loading log...')
  [STREAM_LOADING]: 'Loading log...',
  // t('Log stream paused.')
  [STREAM_PAUSED]: 'Log stream paused.',
  // t('Log streaming...')
  [STREAM_ACTIVE]: 'Log streaming...',
};

// Handle UTF-8 encoding in raw pod logs to support multi-language characters.
const handleRawLogs = (logURL: string) => {
  return (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();

    fetch(logURL)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        const text = new TextDecoder('utf-8').decode(arrayBuffer);
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch and decode log file with UTF-8:', err);
      });
  };
};

const replaceVariables = (template: string, values: any): string => {
  return _.reduce(
    values,
    (result, value, name) => {
      // Replace all occurrences of template expressions like "${name}" with the URL-encoded value.
      // eslint-disable-next-line prefer-template
      const pattern = _.escapeRegExp('${' + name + '}');
      return result.replace(new RegExp(pattern, 'g'), encodeURIComponent(value));
    },
    template,
  );
};

// Build a log API url for a given resource
const getResourceLogURL = (
  resource: K8sResourceKind,
  containerName?: string,
  tailLines?: number,
  follow?: boolean,
  logType?: LogTypeStatus,
): string => {
  const previous = logType === LOG_TYPE_PREVIOUS;
  return resourceURL(modelFor(resource.kind), {
    name: resource.metadata.name,
    ns: resource.metadata.namespace,
    path: 'log',
    queryParams: {
      container: containerName || '',
      ...(tailLines && { tailLines: `${tailLines}` }),
      ...(follow && { follow: `${follow}` }),
      ...(previous && { previous: `${previous}` }),
    },
  });
};

const HeaderBanner = ({ lines, status }: { lines: string[]; status: string }) => {
  const { t } = useTranslation('public');
  const count = lines[lines.length - 1] || lines.length === 0 ? lines.length : lines.length - 1;
  const headerText = t('{{count}} line', { count });
  const isEOF = status === STREAM_EOF;
  return (
    <Banner status={(isEOF ? 'info' : undefined) as BannerStatus}>
      {headerText}
      {isEOF && ` - ${t('Log stream ended.')}`}
    </Banner>
  );
};

const FooterButton = ({ setStatus, linesBehind, className }) => {
  const { t } = useTranslation('public');
  const resumeText =
    linesBehind > 0
      ? t('Resume stream and show {{count}} new line', { count: linesBehind })
      : t('Resume stream');
  const handleClick = () => {
    setStatus(STREAM_ACTIVE);
  };
  return (
    <Button icon={<OutlinedPlayCircleIcon />} className={className} onClick={handleClick} isBlock>
      &nbsp;{resumeText}
    </Button>
  );
};
const showDebugAction = (pod: PodKind, containerName: string) => {
  if (!containerName) {
    return false;
  }
  const containerStatus = pod?.status?.containerStatuses?.find((c) => c.name === containerName);
  if (pod?.metadata?.annotations?.['openshift.io/build.name']) {
    return false;
  }
  if (pod?.metadata?.annotations?.['debug.openshift.io/source-container']) {
    return false;
  }

  const waitingReason = containerStatus?.state?.waiting?.reason;
  if (waitingReason === 'ImagePullBackOff' || waitingReason === 'ErrImagePull') {
    return false;
  }

  return !containerStatus?.state?.running || !containerStatus?.ready;
};

// Component for log stream controls
const LogControls: React.FCC<LogControlsProps> = ({
  dropdown,
  toggleFullscreen,
  currentLogURL,
  isFullscreen,
  status,
  toggleStreaming,
  resource,
  containerName,
  podLogLinks,
  namespaceUID,
  toggleWrapLines,
  isWrapLines,
  changeLogType,
  hasPreviousLog,
  logType,
  showLogTypeSelect,
  isShowFullLog,
  toggleShowFullLog,
  canUseFullScreen,
}) => {
  const { t } = useTranslation('public');
  const [isLogTypeOpen, setIsLogTypeOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const logTypes: Array<LogType> = [
    { type: LOG_TYPE_CURRENT, text: t('Current log') },
    { type: LOG_TYPE_PREVIOUS, text: t('Previous log') },
  ];

  const playPauseButton = useMemo(() => {
    if (logType !== LOG_TYPE_PREVIOUS) {
      switch (status as keyof typeof streamStatusMessages) {
        case STREAM_LOADING:
          return <Loading className="co-resource-log__loading" />;
        case STREAM_ACTIVE:
        case STREAM_PAUSED:
          return (
            <Tooltip content={t(streamStatusMessages[status])}>
              <TogglePlay
                active={status === STREAM_ACTIVE}
                onClick={toggleStreaming}
                className="pf-v6-u-mr-0"
              />
            </Tooltip>
          );
        case STREAM_EOF:
          return null; // we show this in the line number area
        default:
          return t(streamStatusMessages[status]);
      }
    }
    return t(streamStatusMessages[STREAM_EOF]);
  }, [status, toggleStreaming, logType, t]);

  const logTypeSelect = () => {
    if (!showLogTypeSelect) {
      return null;
    }

    const select = (
      <Select
        toggle={(toggleRef: Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsLogTypeOpen((isOpen) => !isOpen)}
            isExpanded={isLogTypeOpen}
            isDisabled={!hasPreviousLog}
            aria-label={t('Log type')}
          >
            {logTypes.find((lt) => lt.type === logType).text}
          </MenuToggle>
        )}
        onSelect={(_event, value: LogTypeStatus) => {
          changeLogType(value);
          setIsLogTypeOpen(false);
        }}
        selected={logType}
        onOpenChange={(isOpen) => setIsLogTypeOpen(isOpen)}
        isOpen={isLogTypeOpen}
        popperProps={{
          appendTo: 'inline', // needed for fullscreen
        }}
      >
        <SelectList>
          {logTypes.map((log) => (
            <SelectOption key={log.type} value={log.type}>
              {log.text}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    );

    return hasPreviousLog ? (
      select
    ) : (
      <Tooltip content={t('Only the current log is available for this container.')}>
        {select}
      </Tooltip>
    );
  };

  const renderPodLogLinks = () =>
    _.map(_.sortBy(podLogLinks, 'metadata.name'), (link) => {
      const namespace = resource.metadata.namespace;
      const namespaceFilter = link.spec.namespaceFilter;
      if (namespaceFilter) {
        try {
          const namespaceRegExp = new RegExp(namespaceFilter, 'g');
          if (namespace.search(namespaceRegExp)) {
            return null;
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('invalid log link regex', namespaceFilter, e);
          return null;
        }
      }
      const url = replaceVariables(link.spec.hrefTemplate, {
        resourceName: resource.metadata.name,
        resourceUID: resource.metadata.uid,
        containerName,
        resourceNamespace: namespace,
        resourceNamespaceUID: namespaceUID,
        podLabels: JSON.stringify(resource.metadata.labels),
      });

      return (
        <ExternalLink
          key={link.metadata.uid}
          href={url}
          text={link.spec.text}
          dataTestID={link.metadata.name}
        />
      );
    });

  const options = (
    <Select
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={() => setIsOptionsOpen((isOpen) => !isOpen)}
          isExpanded={isOptionsOpen}
          icon={<CogIcon />}
          data-test="resource-log-options-toggle"
        >
          <span className="pf-v6-u-display-none pf-v6-u-display-inline-on-lg">{t('Options')}</span>
        </MenuToggle>
      )}
      onSelect={(_event, value: string) => {
        switch (value) {
          case 'fullLog':
            toggleShowFullLog(!isShowFullLog);
            break;
          case 'wrapLines':
            toggleWrapLines(!isWrapLines);
            break;
          default:
        }
      }}
      onOpenChange={setIsOptionsOpen}
      isOpen={isOptionsOpen}
      popperProps={{
        appendTo: 'inline', // needed for fullscreen
      }}
    >
      <SelectList>
        <Tooltip
          content={t('Select to view the entire log. Default view is the last 1,000 lines.')}
          position="right"
        >
          <SelectOption
            key="fullLog"
            value="fullLog"
            isSelected={isShowFullLog}
            hasCheckbox
            data-test-dropdown-menu="show-full-log"
          >
            {t('Show full log')}
          </SelectOption>
        </Tooltip>
        <SelectOption
          key="wrapLines"
          value="wrapLines"
          isSelected={isWrapLines}
          hasCheckbox
          data-test-dropdown-menu="wrap-lines"
        >
          {t('Wrap lines')}
        </SelectOption>
      </SelectList>
    </Select>
  );

  const debugAction =
    showDebugAction(resource, containerName) &&
    (isWindowsPod(resource) ? (
      <Tooltip content={t('Debug in terminal is not currently available for Windows containers.')}>
        <Button variant="control" isDisabled icon={<BugIcon />} aria-label={t('Debug container')} />
      </Tooltip>
    ) : (
      <Tooltip content={t('Debug container')}>
        <Button
          variant="control"
          component={LinkTo(
            `${resourcePath(
              'Pod',
              resource.metadata.name,
              resource.metadata.namespace,
            )}/containers/${containerName}/debug`,
          )}
          icon={<BugIcon />}
          aria-label={t('Debug container')}
          data-test="debug-container-link"
        />
      </Tooltip>
    ));

  return (
    <Toolbar data-test="resource-log-toolbar">
      <ToolbarContent>
        <ToolbarGroup className="pf-v6-u-display-flex pf-v6-u-flex-direction-column pf-v6-u-flex-direction-row-on-md pf-v6-u-w-100">
          <ToolbarGroup align={{ default: 'alignStart' }}>
            {/* orphaned `co-toolbar__item used in https://github.com/openshift/verification-tests */}
            {playPauseButton && (
              <ToolbarItem className="co-toolbar__item">{playPauseButton}</ToolbarItem>
            )}
            {dropdown && <ToolbarItem>{dropdown}</ToolbarItem>}
            {debugAction && <ToolbarItem>{debugAction}</ToolbarItem>}
            <ToolbarItem>{options}</ToolbarItem>
          </ToolbarGroup>

          <ToolbarGroup align={{ default: 'alignEnd' }}>
            {!_.isEmpty(podLogLinks) && renderPodLogLinks()}
            <ToolbarGroup>
              <ToolbarToggleGroup toggleIcon={<SearchIcon />} breakpoint="lg">
                <ToolbarItem>
                  <LogViewerSearch
                    onFocus={() => {
                      if (status === STREAM_ACTIVE) {
                        toggleStreaming();
                      }
                    }}
                    placeholder={t('Search logs')}
                    minSearchChars={0}
                  />
                </ToolbarItem>
              </ToolbarToggleGroup>
              <ToolbarItem>{logTypeSelect()}</ToolbarItem>
            </ToolbarGroup>

            <ToolbarGroup variant="action-group-plain">
              <ToolbarItem>
                <Tooltip content={t('View raw logs')}>
                  <Button
                    variant="plain"
                    onClick={handleRawLogs(currentLogURL)}
                    aria-label={t('Open raw log file in new window')}
                    icon={<OutlinedWindowRestoreIcon />}
                  />
                </Tooltip>
              </ToolbarItem>
              <ToolbarItem>
                <Tooltip content={t('Download')}>
                  <ExternalLinkButton
                    variant="plain"
                    href={currentLogURL}
                    download={`${resource.metadata.name}-${containerName}.log`}
                    icon={<DownloadIcon />}
                  />
                </Tooltip>
              </ToolbarItem>
              {canUseFullScreen && (
                <ToolbarItem>
                  <Tooltip content={isFullscreen ? t('Collapse') : t('Expand')}>
                    <Button
                      variant="plain"
                      onClick={toggleFullscreen}
                      icon={isFullscreen ? <CompressIcon /> : <ExpandIcon />}
                    />
                  </Tooltip>
                </ToolbarItem>
              )}
            </ToolbarGroup>
          </ToolbarGroup>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

// Resource agnostic log component
export const ResourceLog: React.FCC<ResourceLogProps> = ({
  bufferSize = DEFAULT_BUFFER_SIZE,
  containerName,
  dropdown,
  resource,
  resourceStatus,
}) => {
  const { t } = useTranslation('public');
  const theme = useContext(ThemeContext);
  const [showFullLog, setShowFullLog] = useUserSettings<boolean>(
    SHOW_FULL_LOG_USERSETTINGS_KEY,
    false,
    true,
  );
  const [showFullLogCheckbox, setShowFullLogCheckbox] = useState(showFullLog);
  const buffer = useToggleLineBuffer(showFullLogCheckbox ? null : bufferSize);
  const ws = useRef<any>(); // TODO Make this a hook
  const [resourceLogRef, toggleFullscreen, isFullscreen, canUseFullScreen] = useFullscreen();
  const logViewerRef = useRef(null);
  const externalLogLinkFlag = useFlag(FLAGS.CONSOLE_EXTERNAL_LOG_LINK);
  const [error, setError] = useState(false);
  const [hasTruncated, setHasTruncated] = useState(false);
  const [lines, setLines] = useState([]);
  const [linesBehind, setLinesBehind] = useState(0);
  const [totalLineCount, setTotalLineCount] = useState(0);
  const [stale, setStale] = useState(false);
  const [status, setStatus] = useState(STREAM_LOADING);
  const [namespaceUID, setNamespaceUID] = useState('');
  const [podLogLinks, setPodLogLinks] = useState();
  const [content, setContent] = useState('');

  const [logType, setLogType] = useState<LogTypeStatus>(LOG_TYPE_CURRENT);
  const [hasPreviousLogs, setPreviousLogs] = useState(false);

  const previousResourceStatus = usePrevious(resourceStatus);
  const previousTotalLineCount = usePrevious(totalLineCount);
  const linkURL = getResourceLogURL(resource, containerName, null, false, logType);
  const watchURL = getResourceLogURL(resource, containerName, null, true, logType);
  const imp = useSelector((state: RootState) => getImpersonate(state));
  const subprotocols = useMemo(() => ['base64.binary.k8s.io', ...(imp?.subprotocols ?? [])], [imp]);
  const [wrapLines, setWrapLines] = useUserSettings<boolean>(
    LOG_WRAP_LINES_USERSETTINGS_KEY,
    false,
    true,
  );
  const hasWrapAnnotation =
    resource?.metadata?.annotations?.['console.openshift.io/wrap-log-lines'] === 'true';

  const [wrapLinesCheckbox, setWrapLinesCheckbox] = useState(wrapLines || hasWrapAnnotation);
  const firstRender = useRef(true);
  const handleShowFullLogCheckbox = () => setShowFullLogCheckbox(!showFullLogCheckbox);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    setWrapLines(wrapLinesCheckbox);
    setShowFullLog(showFullLogCheckbox);
  }, [wrapLinesCheckbox, showFullLogCheckbox, setWrapLines, setShowFullLog]);

  const timeoutIdRef = useRef(null);
  const countRef = useRef(0);

  useEffect(() => {
    if ((status === STREAM_ACTIVE || status === STREAM_EOF) && lines.length > 0) {
      setContent(lines.join('\n'));
      // setTimeout here to wait until the content is updated in the log viewer
      // so that make sure scroll to the real bottom
      setTimeout(() => {
        if (logViewerRef && logViewerRef.current) {
          logViewerRef.current.scrollToBottom();
        }
      }, 1);
    }
  }, [status, lines]);

  // Update lines behind while stream is paused, reset when unpaused
  useEffect(() => {
    if (status === STREAM_ACTIVE) {
      setLinesBehind(0);
    }

    if (status === STREAM_PAUSED) {
      setLinesBehind(
        (currentLinesBehind) => currentLinesBehind + (totalLineCount - previousTotalLineCount),
      );
    }
  }, [status, totalLineCount, previousTotalLineCount]);

  // Set back to viewing current log when switching containers
  useEffect(() => {
    if (resource.kind === 'Pod') {
      setLogType(LOG_TYPE_CURRENT);
    }
  }, [resource.kind, containerName]);

  //Check to see if previous log exists
  useEffect(() => {
    if (resource.kind === 'Pod') {
      const container = resource.status?.containerStatuses?.find(
        (pod) => pod.name === containerName,
      );
      setPreviousLogs(container?.restartCount > 0); // Assuming previous log is available if the container has been restarted at least once
    }
  }, [containerName, resource.kind, resource.status]);

  const startWebSocket = useCallback(() => {
    // Handler for websocket onopen event
    const onOpen = () => {
      buffer.current.clear();
      setStatus(STREAM_ACTIVE);
    };
    // Handler for websocket onclose event
    const onClose = () => {
      setStatus(STREAM_EOF);
    };
    // Handler for websocket onerror event
    const onError = () => {
      setError(true);
    };
    // Handler for websocket onmessage event
    const onMessage = (msg) => {
      if (msg) {
        clearTimeout(timeoutIdRef.current);
        const text = Base64.decode(msg);
        countRef.current += buffer.current.ingest(text);
        // Set a timeout here to render more logs together when initializing
        timeoutIdRef.current = setTimeout(() => {
          setTotalLineCount((currentLineCount) => currentLineCount + countRef.current);
          countRef.current = 0;
          setLines(
            buffer.current.getTail() === ''
              ? [...buffer.current.getLines()]
              : [...buffer.current.getLines(), buffer.current.getTail()],
          );
          setHasTruncated(buffer.current.getHasTruncated());
        }, 10);
      }
    };
    setError(false);
    setHasTruncated(false);
    setLines([]);
    setTotalLineCount(0);
    setLinesBehind(0);
    setContent('');
    setStale(false);
    setStatus(STREAM_LOADING);
    ws.current?.destroy();
    ws.current = new WSFactory(watchURL, {
      host: 'auto',
      path: watchURL,
      subprotocols,
    })
      .onclose(onClose)
      .onerror(onError)
      .onmessage(onMessage)
      .onopen(onOpen);
  }, [watchURL, subprotocols, buffer]);
  // Restart websocket if startWebSocket function changes
  useEffect(() => {
    if (
      !error &&
      !stale &&
      [LOG_SOURCE_RUNNING, LOG_SOURCE_TERMINATED, LOG_SOURCE_RESTARTING].includes(resourceStatus)
    ) {
      startWebSocket();
    }
    return () => ws.current?.destroy();
  }, [error, resourceStatus, stale, startWebSocket, showFullLogCheckbox]);

  // Toggle streaming/paused status
  const toggleStreaming = () => {
    setStatus((currentStatus) => (currentStatus === STREAM_ACTIVE ? STREAM_PAUSED : STREAM_ACTIVE));
  };

  useEffect(() => {
    if (externalLogLinkFlag && resource.kind === 'Pod') {
      Promise.all([
        k8sList(ConsoleExternalLogLinkModel),
        k8sGet(ProjectModel, resource.metadata.namespace),
      ])
        .then(([podLogLinks_, project]) => {
          // Project UID and namespace UID are the same value. Use the projects
          // API since normal OpenShift users can list projects.
          setPodLogLinks(podLogLinks_);
          setNamespaceUID(project.metadata.uid);
        })
        .catch((e) => setError(e));
    }
  }, [externalLogLinkFlag, resource.kind, resource.metadata.namespace]);

  // If container comes out of restarting state, currently displayed logs might be stale
  useEffect(() => {
    if (
      previousResourceStatus === LOG_SOURCE_RESTARTING &&
      resourceStatus !== LOG_SOURCE_RESTARTING
    ) {
      setStale(true);
    }
  }, [previousResourceStatus, resourceStatus]);

  const onScroll = ({ scrollOffsetToBottom, scrollDirection, scrollUpdateWasRequested }) => {
    if (!scrollUpdateWasRequested && status !== STREAM_EOF) {
      if (scrollOffsetToBottom < 1) {
        setStatus(STREAM_ACTIVE);
      } else if (scrollDirection === 'backward') {
        setStatus(STREAM_PAUSED);
      }
    }
  };

  const logControls = (
    <LogControls
      currentLogURL={linkURL}
      dropdown={dropdown}
      isFullscreen={isFullscreen}
      status={status}
      toggleFullscreen={toggleFullscreen}
      canUseFullScreen={canUseFullScreen}
      toggleStreaming={toggleStreaming}
      resource={resource}
      containerName={containerName}
      podLogLinks={podLogLinks}
      namespaceUID={namespaceUID}
      toggleWrapLines={setWrapLinesCheckbox}
      isWrapLines={wrapLinesCheckbox}
      isShowFullLog={showFullLogCheckbox}
      hasPreviousLog={hasPreviousLogs}
      changeLogType={setLogType}
      logType={logType}
      showLogTypeSelect={resource.kind === 'Pod'}
      toggleShowFullLog={handleShowFullLogCheckbox}
    />
  );

  return (
    <div
      ref={resourceLogRef}
      className={css('co-resource-log', { 'co-fullscreen pf-v6-u-p-sm': isFullscreen })}
    >
      {error ||
        stale ||
        (hasTruncated && (
          <div className="co-resource-log__alert-wrapper">
            {error && (
              <Alert
                isInline
                className="co-alert co-alert--margin-bottom-sm"
                variant="danger"
                title={t('An error occurred while retrieving the requested logs.')}
                actionLinks={
                  <AlertActionLink onClick={() => setError(false)}>{t('Retry')}</AlertActionLink>
                }
              />
            )}
            {stale && (
              <Alert
                isInline
                className="co-alert co-alert--margin-bottom-sm"
                variant="info"
                title={t('The logs for this {{resourceKind}} may be stale.', {
                  resourceKind: resource.kind,
                })}
                actionLinks={
                  <AlertActionLink onClick={() => setStale(false)}>{t('Refresh')}</AlertActionLink>
                }
              />
            )}
            {hasTruncated && (
              <Alert
                isInline
                className="co-alert co-alert--margin-bottom-sm"
                variant="warning"
                title={t('Some lines have been abridged because they are exceptionally long.')}
              >
                <Trans ns="public" t={t}>
                  To view unabridged log content, you can either{' '}
                  <a href="#" onClick={handleRawLogs(linkURL)}>
                    open the raw file in another window
                  </a>{' '}
                  or{' '}
                  <a href={linkURL} download={`${resource.metadata.name}-${containerName}.log`}>
                    download it
                  </a>
                  .
                </Trans>
              </Alert>
            )}
          </div>
        ))}
      <div>
        <LogViewer
          header={
            <div className="log-window__header" data-test="resource-log-no-lines">
              <HeaderBanner lines={lines} status={status} />
            </div>
          }
          theme={theme}
          data={content}
          ref={logViewerRef}
          height="100%"
          isTextWrapped={wrapLinesCheckbox}
          toolbar={logControls}
          footer={
            <FooterButton
              className={css('log-window__footer', {
                'log-window__footer--hidden': status !== STREAM_PAUSED,
              })}
              setStatus={setStatus}
              linesBehind={linesBehind}
            />
          }
          onScroll={onScroll}
          initialIndexWidth={7}
        />
      </div>
    </div>
  );
};

type LogControlsProps = {
  currentLogURL: string;
  isFullscreen: boolean;
  canUseFullScreen?: boolean;
  dropdown?: ReactNode;
  status?: string;
  resource?: any;
  containerName?: string;
  podLogLinks?: K8sResourceKind[];
  namespaceUID?: string;
  toggleStreaming?: () => void;
  toggleFullscreen: () => void;
  toggleWrapLines: (wrapLinesCheckbox: boolean) => void;
  isWrapLines: boolean;
  changeLogType: (type: LogTypeStatus) => void;
  hasPreviousLog?: boolean;
  logType: LogTypeStatus;
  showLogTypeSelect: boolean;
  toggleShowFullLog: (showFullLogCheckbox: boolean) => void;
  isShowFullLog: boolean;
};

type ResourceLogProps = {
  containerName?: string;
  dropdown?: ReactNode;
  resource: any;
  resourceStatus: string;
  bufferSize?: number;
};

type LogTypeStatus = typeof LOG_TYPE_CURRENT | typeof LOG_TYPE_PREVIOUS;
type LogType = { type: LogTypeStatus; text: string };
