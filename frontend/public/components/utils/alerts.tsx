import type { FC, ReactNode } from 'react';
import { useState } from 'react';
import * as _ from 'lodash';
import {
  Alert,
  AlertVariant,
  Button,
  Flex,
  FlexItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export const ExpandableAlert: FC<CustomAlertProps> = ({ alerts, variant }) => {
  const alertCount = alerts.length;
  const [expanded, setExpanded] = useState(false);
  const alertContent =
    alertCount > 1 ? (
      <List>
        {_.map(alerts, (error, i) => (
          <ListItem key={i}>{error}</ListItem>
        ))}
      </List>
    ) : (
      alerts
    );
  const { t } = useTranslation('public');

  return (
    <Alert
      isInline
      variant={variant}
      className="co-alert"
      title={
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            {t('There is {{count}} {{variant}} alert', { count: alertCount, variant })}
          </FlexItem>
          <FlexItem>
            <Button
              type="button"
              onClick={() => setExpanded(!expanded)}
              variant="link"
              className="pf-v6-u-py-0"
            >
              {expanded ? t('Hide details') : t('Show details')}
            </Button>
          </FlexItem>
        </Flex>
      }
    >
      {expanded && alertContent}
    </Alert>
  );
};

type CustomAlertProps = {
  alerts: ReactNode[];
  variant: AlertVariant;
};
