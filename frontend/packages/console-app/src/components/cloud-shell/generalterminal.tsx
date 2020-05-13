import * as React from 'react';
import * as _ from 'lodash-es';
import { Terminal as XTerminal } from 'xterm';
import Measure from 'react-measure';
import * as fit from 'xterm/lib/addons/fit/fit';
import * as full from 'xterm/lib/addons/fullscreen/fullscreen';

XTerminal.applyAddon(fit);
XTerminal.applyAddon(full);

const AutoResizeTerminal: React.FC<any> = ({ onData, className }) => {
  const innerRef = React.createRef<any>();
  const outerRef = React.createRef<any>();
  const [height, setHeight] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const padding = 20;
  const options = {
    fontFamily: 'monospace',
    fontSize: 16,
    cursorBlink: false,
    cols: 80,
    rows: 25,
  };
  const terminal: any = new XTerminal(Object.assign({}, options));
  terminal.on('data', onData);

  terminal.open(innerRef.current);

  const focus = () => {
    terminal && terminal.focus();
  };

  const onResize = () => {
    const node = outerRef.current;

    if (!node) {
      return;
    }

    const bodyRect = document.body.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();

    // This assumes we want to fill everything below and to the right.  In full-screen, fill entire viewport
    // Use body height when node top is too close to pageRect height
    const bottom = bodyRect.bottom;
    const computedHeight = Math.floor(bottom - nodeRect.top - padding);
    const computedWidth = Math.floor(bodyRect.width - nodeRect.left - padding);

    if (height === computedHeight && width === computedWidth) {
      return;
    }
    // rerender with correct dimensions
    setHeight(height);
    setWidth(width);
    if (!terminal) {
      return;
    }
    // tell the terminal to resize itself
    terminal.fit();
  };

  return (
    <Measure
      bounds
      onResize={(contenRect) => {
        onResize();
        console.log('resized terminal', height, width);
      }}
    >
      {({ measureRef }) => (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: padding / 2,
          }}
          ref={measureRef}
        >
          <div ref={outerRef} className={className}>
            <div ref={innerRef} style={{ width, height }} className="console"></div>
          </div>
        </div>
      )}
    </Measure>
  );
};

export default AutoResizeTerminal;
