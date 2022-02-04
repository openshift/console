import * as React from 'react';
import { DefaultCreateConnector, Point } from '@patternfly/react-topology';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import './CreateConnector.scss';

type CreateConnectorProps = {
  startPoint: Point;
  endPoint: Point;
  hints: string[];
  dragging?: boolean;
};

const CreateConnector: React.FC<CreateConnectorProps> = ({
  startPoint,
  endPoint,
  dragging,
  hints,
}) => {
  const { t } = useTranslation();
  const [hover, setHover] = React.useState(false);
  const unsetHandle = React.useRef<number>();

  React.useEffect(() => {
    setHover(false);
    clearTimeout(unsetHandle.current);
    unsetHandle.current = window.setTimeout(() => {
      if (unsetHandle.current) {
        setHover(dragging);
      }
    }, 2000);
    return () => {
      clearTimeout(unsetHandle.current);
      unsetHandle.current = null;
    };
  }, [endPoint.x, endPoint.y, dragging]);

  const classes = classnames('odc-create-connector', { 'is-dragging': dragging });
  return (
    <DefaultCreateConnector
      className={classes}
      startPoint={startPoint}
      endPoint={endPoint}
      dragging={dragging}
      hints={hints}
      tipContents={hover && dragging ? t('topology~Add resources') : null}
    />
  );
};

export default CreateConnector;
