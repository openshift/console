import type { FC } from 'react';
import { DefaultCreateConnector } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import type { CreateConnectorProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';

const CreateConnector: FC<CreateConnectorProps> = ({
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
