import * as React from 'react';
import { DefaultCreateConnector, Point } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';

type CreateConnectorProps = {
  startPoint: Point;
  endPoint: Point;
  hints: string[];
  dragging?: boolean;
  hover?: boolean;
};

const CreateConnector: React.FC<CreateConnectorProps> = ({
  startPoint,
  endPoint,
  dragging,
  hover,
  hints,
}) => {
  const { t } = useTranslation();
  return (
    <DefaultCreateConnector
      startPoint={startPoint}
      endPoint={endPoint}
      dragging={dragging}
      hints={hints}
      hover={hover}
      tipContents={hover && dragging ? t('topology~Add resources') : null}
    />
  );
};

export default CreateConnector;
