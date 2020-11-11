import * as React from 'react';
import { Base64 } from 'js-base64';
import { Alert } from '@patternfly/react-core';
import { resourceURL, modelFor, PodKind, ContainerSpec } from '@console/internal/module/k8s';
import { WSFactory } from '@console/internal/module/ws-factory';
import { LOG_SOURCE_TERMINATED } from '@console/internal/components/utils';
import { coFetchText } from '@console/internal/co-fetch';
import './Logs.scss';

type LogsProps = {
  resource: PodKind;
  resourceStatus: string;
  container: ContainerSpec;
  render: boolean;
  autoScroll?: boolean;
  onComplete: (containerName: string) => void;
};

const Logs: React.FC<LogsProps> = ({
  resource,
  resourceStatus,
  container,
  onComplete,
  render,
  autoScroll = true,
}) => {
  const { name } = container;
  const { kind, metadata = {} } = resource;
  const { name: resName, namespace: resNamespace } = metadata;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<boolean>(false);
  const resourceStatusRef = React.useRef<string>(resourceStatus);
  const onCompleteRef = React.useRef<(name) => void>();
  onCompleteRef.current = onComplete;
  const appendMessage = React.useRef<(blockContent) => void>();
  const prevFetchNewline = React.useRef(true);
  appendMessage.current = React.useCallback(
    (blockContent: string) => {
      const contentLines = blockContent.split('\n').filter((line) => !!line);
      if (!prevFetchNewline.current && contentRef.current.lastChild) {
        contentRef.current.lastChild.textContent += contentLines.shift();
      }
      prevFetchNewline.current = blockContent.endsWith('\n');
      if (contentRef.current && contentLines.length >= 0) {
        const elements = contentLines.map((content) => {
          const customElement = document.createElement('div');
          customElement.textContent = content;
          return customElement;
        });
        elements.forEach((element) => {
          contentRef.current.append(element);
        });
        const lastElement = elements[elements.length - 1];
        if (render && lastElement && autoScroll) {
          lastElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    },
    [autoScroll, render],
  );

  if (resourceStatusRef.current !== resourceStatus) {
    resourceStatusRef.current = resourceStatus;
  }

  React.useEffect(() => {
    let loaded: boolean = false;
    let ws: WSFactory;
    const urlOpts = {
      ns: resNamespace,
      name: resName,
      path: 'log',
      queryParams: {
        container: name,
        follow: 'true',
      },
    };
    const watchURL = resourceURL(modelFor(kind), urlOpts);
    if (resourceStatusRef.current === LOG_SOURCE_TERMINATED) {
      coFetchText(watchURL)
        .then((res) => {
          if (loaded) return;
          appendMessage.current(res);
          onCompleteRef.current(name);
        })
        .catch(() => {
          if (loaded) return;
          setError(true);
          onCompleteRef.current(name);
        });
    } else {
      const wsOpts = {
        host: 'auto',
        path: watchURL,
        subprotocols: ['base64.binary.k8s.io'],
      };
      ws = new WSFactory(watchURL, wsOpts);
      ws.onmessage((msg) => {
        if (loaded) return;
        const message = Base64.decode(msg);
        appendMessage.current(message);
      })
        .onclose(() => {
          onCompleteRef.current(name);
        })
        .onerror(() => {
          if (loaded) return;
          setError(true);
          onCompleteRef.current(name);
        });
    }
    return () => {
      loaded = true;
      ws && ws.destroy();
    };
  }, [kind, name, resName, resNamespace]);

  React.useEffect(() => {
    if (contentRef.current && render && autoScroll) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [autoScroll, render]);
  return (
    <div className="odc-logs" style={{ display: render ? '' : 'none' }}>
      <p className="odc-logs__name">{name}</p>
      {error && (
        <Alert
          variant="danger"
          isInline
          title="An error occurred while retrieving the requested logs."
        />
      )}
      <div className="odc-logs__content" ref={contentRef} />
    </div>
  );
};

export default Logs;
