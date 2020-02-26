import * as React from 'react';
import * as classNames from 'classnames';
import { CreateConnectorRenderer, DefaultCreateConnector } from '@console/topology';

import './CreateConnector.scss';

const CreateConnector: CreateConnectorRenderer = ({ startPoint, endPoint, dragging, hints }) => {
  const [hover, setHover] = React.useState(false);
  const unsetHandle = React.useRef<number>();

  React.useEffect(() => {
    setHover(false);
    clearTimeout(unsetHandle.current);
    unsetHandle.current = window.setTimeout(() => {
      setHover(dragging);
    }, 2000);
    return () => {
      clearTimeout(unsetHandle.current);
    };
  }, [endPoint.x, endPoint.y, dragging]);

  const classes = classNames('odc-create-connector', { 'is-dragging': dragging });
  return (
    <DefaultCreateConnector
      className={classes}
      startPoint={startPoint}
      endPoint={endPoint}
      dragging={dragging}
      hints={hints}
      tipContents={hover && dragging ? 'Add Resources' : null}
    />
  );
};

export default CreateConnector;
