import * as React from 'react';
import { DefaultCreateConnector } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { CreateConnectorProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';

const CreateConnector: React.FC<CreateConnectorProps> = ({
  startPoint,
  endPoint,
  dragging = false,
  hover = false,
  hints = [],
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
