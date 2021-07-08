import * as React from 'react';
import { Button } from '@patternfly/react-core';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import {
  CompressIcon,
  ExpandIcon,
  DownloadIcon,
  OutlinedWindowRestoreIcon,
} from '@patternfly/react-icons';
import * as classNames from 'classnames';
import { FLAGS } from '@console/shared/src/constants';
import { LogWindow, ExternalLink } from './';
import { modelFor, resourceURL } from '../../module/k8s';
import * as screenfull from 'screenfull';
import { k8sGet, k8sList, K8sResourceKind } from '@console/internal/module/k8s';
import { ConsoleExternalLogLinkModel, ProjectModel } from '@console/internal/models';
import { useFlag } from '@console/shared/src/hooks/flag';

export const STREAM_EOF = 'eof';
export const STREAM_LOADING = 'loading';
export const STREAM_PAUSED = 'paused';
export const STREAM_ACTIVE = 'streaming';

export const LOG_SOURCE_RESTARTING = 'restarting';
export const LOG_SOURCE_RUNNING = 'running';
export const LOG_SOURCE_TERMINATED = 'terminated';
export const LOG_SOURCE_WAITING = 'waiting';

const DEFAULT_BUFFER_SIZE = 1000;

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
): string => {
  return resourceURL(modelFor(resource.kind), {
    name: resource.metadata.name,
    ns: resource.metadata.namespace,
    path: 'log',
    queryParams: {
      container: containerName || '',
      ...(tailLines && { tailLines: `${tailLines}` }),
      ...(follow && { follow: `${follow}` }),
    },
  });
};

// Component for log stream controls
export const LogControls: React.FC<LogControlsProps> = ({
  dropdown,
  toggleFullscreen,
  currentLogURL,
  isFullscreen,
  resource,
  containerName,
  podLogLinks,
  namespaceUID,
}) => {
  const { t } = useTranslation();
  return (
    <div className="co-toolbar">
      <div className="co-toolbar__group co-toolbar__group--left">
        {dropdown && <div className="co-toolbar__item">{dropdown}</div>}
      </div>
      <div className="co-toolbar__group co-toolbar__group--right">
        {!_.isEmpty(podLogLinks) &&
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
              <React.Fragment key={link.metadata.uid}>
                <ExternalLink href={url} text={link.spec.text} dataTestID={link.metadata.name} />
                <span aria-hidden="true" className="co-action-divider hidden-xs">
                  |
                </span>
              </React.Fragment>
            );
          })}
        <a href={currentLogURL} target="_blank" rel="noopener noreferrer">
          <OutlinedWindowRestoreIcon className="co-icon-space-r" />
          {t('public~Raw')}
        </a>
        <span aria-hidden="true" className="co-action-divider hidden-xs">
          |
        </span>
        <a href={currentLogURL} download>
          <DownloadIcon className="co-icon-space-r" />
          {t('public~Download')}
        </a>
        {screenfull.enabled && (
          <>
            <span aria-hidden="true" className="co-action-divider hidden-xs">
              |
            </span>
            <Button variant="link" isInline onClick={toggleFullscreen}>
              {isFullscreen ? (
                <>
                  <CompressIcon className="co-icon-space-r" />
                  {t('public~Collapse')}
                </>
              ) : (
                <>
                  <ExpandIcon className="co-icon-space-r" />
                  {t('public~Expand')}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Resource agnostic log component
export const AlertResourceLog: React.FC<ResourceLogProps> = ({
  bufferSize = DEFAULT_BUFFER_SIZE,
  containerName,
  dropdown,
  resource,
  alertLogs,
}) => {
  const resourceLogRef = React.useRef();
  const externalLogLinkFlag = useFlag(FLAGS.CONSOLE_EXTERNAL_LOG_LINK);
  const [status, setStatus] = React.useState(STREAM_LOADING);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [namespaceUID, setNamespaceUID] = React.useState('');
  const [podLogLinks, setPodLogLinks] = React.useState();
  const linkURL = getResourceLogURL(resource, containerName);
  const lines = [];
  const bufferFull = lines.length === bufferSize;
  const linesBehind = 0;

  // Toggle currently displayed log content to/from fullscreen
  const toggleFullscreen = () => {
    resourceLogRef.current && screenfull.enabled && screenfull.toggle(resourceLogRef.current);
  };

  // Toggle streaming/paused status
  const toggleStreaming = () => {
    setStatus((currentStatus) => (currentStatus === STREAM_ACTIVE ? STREAM_PAUSED : STREAM_ACTIVE));
  };

  //
  React.useEffect(() => {
    if (externalLogLinkFlag && resource.kind === 'Pod') {
      Promise.all([
        k8sList(ConsoleExternalLogLinkModel),
        k8sGet(ProjectModel, resource.metadata.namespace),
      ]).then(([podLogLinks_, project]) => {
        // Project UID and namespace UID are the same value. Use the projects
        // API since normal OpenShift users can list projects.
        setPodLogLinks(podLogLinks_);
        setNamespaceUID(project.metadata.uid);
      });
      //.catch((e) => setError(e));
    }
  }, [externalLogLinkFlag, resource.kind, resource.metadata.namespace]);

  // Only run once, initialize screenfull
  React.useEffect(() => {
    if (screenfull.enabled) {
      screenfull.on('change', () => {
        setIsFullscreen(screenfull.isFullscreen);
      });
      screenfull.on('error', () => {
        setIsFullscreen(false);
      });
    }

    return () => {
      if (screenfull.enabled) {
        screenfull.off('change');
        screenfull.off('error');
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div
        ref={resourceLogRef}
        className={classNames('resource-log', { 'resource-log--fullscreen': isFullscreen })}
      >
        <LogControls
          currentLogURL={linkURL}
          dropdown={dropdown}
          isFullscreen={isFullscreen}
          status={status}
          toggleFullscreen={toggleFullscreen}
          toggleStreaming={toggleStreaming}
          resource={resource}
          containerName={containerName}
          podLogLinks={podLogLinks}
          namespaceUID={namespaceUID}
          alertLogs={alertLogs}
        />
        {alertLogs !== '' && alertLogs !== undefined && (
          <LogWindow
            bufferFull={bufferFull}
            isFullscreen={isFullscreen}
            lines={alertLogs}
            linesBehind={linesBehind}
            status={status}
            updateStatus={setStatus}
            isHttpApi={true}
          />
        )}
      </div>
    </>
  );
};

type LogControlsProps = {
  currentLogURL: string;
  isFullscreen: boolean;
  dropdown?: React.ReactNode;
  status?: string;
  resource?: any;
  containerName?: string;
  podLogLinks?: K8sResourceKind[];
  namespaceUID?: string;
  toggleStreaming?: () => void;
  toggleFullscreen: () => void;
  alertLogs?: any;
};

type ResourceLogProps = {
  bufferSize?: number;
  containerName?: string;
  dropdown?: React.ReactNode;
  resource: any;
  resourceStatus: string;
  alertLogs?: any;
};
