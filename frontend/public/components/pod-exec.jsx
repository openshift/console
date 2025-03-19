import * as React from 'react';
import * as _ from 'lodash-es';
import { Base64 } from 'js-base64';
import { withTranslation } from 'react-i18next';
import { ExpandIcon } from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import { Button, Alert, AlertActionLink } from '@patternfly/react-core';
import { getImpersonate } from '@console/dynamic-plugin-sdk';

import store from '../redux';
import { ContainerLabel, ContainerSelect, LoadingBox } from './utils';
import { connectToFlags } from '../reducers/connectToFlags';
import { FLAGS } from '@console/shared';
import { Terminal } from './terminal';
import { WSFactory } from '../module/ws-factory';
import { resourceURL } from '../module/k8s';
import { PodModel } from '../models';
import { isWindowsPod } from '../module/k8s/pods';

// pod exec WS protocol is FD prefixed, base64 encoded data (sometimes json stringified)

// Channel 0 is STDIN, 1 is STDOUT, 2 is STDERR (if TTY is not requested), and 3 is a special error channel - 4 is C&C
// The server only reads from STDIN, writes to the other three.
// see also: https://github.com/kubernetes/kubernetes/pull/13885

const NO_SH =
  'starting container process caused "exec: \\"sh\\": executable file not found in $PATH"';

const PodExec_ = connectToFlags(FLAGS.OPENSHIFT)(
  class PodExec extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        open: false,
        containers: {},
        activeContainer:
          props.initialContainer ||
          props.obj.metadata?.annotations?.['kubectl.kubernetes.io/default-container'] ||
          props.obj?.spec.containers[0].name,
      };
      this.terminal = React.createRef();
      this.onResize = (rows, cols) => this.onResize_(rows, cols);
      this.onData = (d) => this.onData_(d);
      this.onChangeContainer = (container) => this.onChangeContainer_(container);
    }
    connect_() {
      const {
        metadata: { name, namespace },
      } = this.props.obj;
      const { activeContainer } = this.state;
      const usedClient = this.props.flags[FLAGS.OPENSHIFT] ? 'oc' : 'kubectl';
      const command = isWindowsPod(this.props.obj) ? ['cmd'] : ['sh', '-i', '-c', 'TERM=xterm sh'];
      const params = {
        ns: namespace,
        name,
        path: 'exec',
        queryParams: {
          stdout: 1,
          stdin: 1,
          stderr: 1,
          tty: 1,
          container: activeContainer,
          command: command.map((c) => encodeURIComponent(c)).join('&command='),
        },
      };

      if (this.ws) {
        this.ws.destroy();
        const { current } = this.terminal;
        current && current.onConnectionClosed(`connecting to ${activeContainer}`);
      }

      const impersonate = getImpersonate(store.getState()) || {};
      const subprotocols = (impersonate.subprotocols || []).concat('base64.channel.k8s.io');

      let previous;
      this.ws = new WSFactory(`${name}-terminal`, {
        host: 'auto',
        reconnect: true,
        path: resourceURL(PodModel, params),
        jsonParse: false,
        subprotocols,
      })
        .onmessage((raw) => {
          const { current } = this.terminal;
          // error channel
          if (raw[0] === '3') {
            if (previous.includes(NO_SH)) {
              current.reset();
              current.onConnectionClosed(
                `This container doesn't have a /bin/sh shell. Try specifying your command in a terminal with:\r\n\r\n ${usedClient} -n ${namespace} exec ${name} -ti <command>`,
              );
              this.ws.destroy();
              previous = '';
              return;
            }
          }
          const data = Base64.decode(raw.slice(1));
          current && current.onDataReceived(data);
          previous = data;
        })
        .onopen(() => {
          const { current } = this.terminal;
          current && current.reset();
          previous = '';
          this.setState({ open: true, error: null });
        })
        .onclose((evt) => {
          if (!evt || evt.wasClean === true) {
            return;
          }
          const error = evt.reason || 'The terminal connection has closed.';
          const i18nError =
            evt.reason || this.props.t('public~The terminal connection has closed.');
          this.setState({ error: i18nError });
          this.terminal.current && this.terminal.current.onConnectionClosed(error);
          this.ws.destroy();
        }) // eslint-disable-next-line no-console
        .onerror((evt) => console.error(`WS error?! ${evt}`));
    }

    componentDidMount() {
      this.connect_();
    }

    componentWillUnmount() {
      const exitCode = 'exit\r';
      this.ws && exitCode.split('').map((t) => this.ws.send(`0${Base64.encode(t)}`));
      this.ws && this.ws.destroy();
      delete this.ws;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      const containers = _.keyBy(_.get(nextProps.obj, 'spec.containers', []), 'name');
      if (_.isEqual(containers, prevState.containers)) {
        return null;
      }
      return { containers };
    }

    onChangeContainer_(container) {
      const name = this.state.containers?.[container]?.name;

      if (!name) {
        // eslint-disable-next-line no-console
        console.warn(`no name, how did that happen? ${container}`);
        return;
      }
      if (name === this.state.activeContainer) {
        return;
      }
      this.setState({ activeContainer: name }, () => {
        this.connect_();
        this.terminal.current && this.terminal.current.focus();
      });
    }

    onResize_(rows, cols) {
      const data = Base64.encode(JSON.stringify({ Height: rows, Width: cols }));
      this.ws && this.ws.send(`4${data}`);
    }

    setFullscreen(fullscreen) {
      this.terminal.current.setFullscreen(fullscreen);
    }

    onData_(data) {
      this.ws && this.ws.send(`0${Base64.encode(data)}`);
    }

    render() {
      const { containers, activeContainer, open, error } = this.state;
      const { message, infoMessage, t, obj } = this.props;

      let contents = <LoadingBox />;
      if (error) {
        contents = <Terminal onResize={() => {}} onData={() => {}} ref={this.terminal} />;
      } else if (open) {
        contents = <Terminal onResize={this.onResize} onData={this.onData} ref={this.terminal} />;
      }

      const reconnectAction =
        obj.status.phase === 'Running' ? (
          <AlertActionLink onClick={() => this.connect_()}>{t('public~Reconnect')}</AlertActionLink>
        ) : null;

      return (
        <div>
          {infoMessage}
          <div className="co-toolbar">
            <div className="co-toolbar__group co-toolbar__group--left">
              <div className="co-toolbar__item">{t('public~Connecting to')}</div>
              <div className="co-toolbar__item">
                {Object.keys(containers).length > 1 ? (
                  <ContainerSelect
                    currentKey={activeContainer}
                    containers={this.state.containers}
                    onChange={this.onChangeContainer}
                  />
                ) : (
                  <ContainerLabel name={activeContainer} />
                )}
              </div>
            </div>
            {!error && (
              <div className="co-toolbar__group co-toolbar__group--right">
                <div className="co-toolbar__item">
                  <Button
                    icon={<ExpandIcon className="co-icon-space-r" />}
                    variant="link"
                    className="pf-m-link--align-right"
                    onClick={() => this.setFullscreen(true)}
                  >
                    {t('public~Expand')}
                  </Button>
                </div>
              </div>
            )}
          </div>
          {error && (
            <Alert variant="warning" title={error} actionLinks={reconnectAction} isInline />
          )}
          {message}
          {contents}
        </div>
      );
    }
  },
);

export const PodExec = withTranslation()(PodExec_);
