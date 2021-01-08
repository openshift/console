import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  TextContent,
  Text,
  TextVariants,
  Card,
  CardBody,
  Split,
  SplitItem,
  AlertVariant,
} from '@patternfly/react-core';
import { LoadingInline } from '@console/internal/components/utils';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
  ErrorAlert,
  RedExclamationCircleIcon,
} from '@console/shared';
import { NodeKind } from '@console/internal/module/k8s';
import {
  ValidationMessage,
  VALIDATIONS,
  ValidationType,
} from '../../../utils/common-ocs-install-el';

const REVIEW_ICON_MAP = {
  [AlertVariant.success]: GreenCheckCircleIcon,
  [AlertVariant.warning]: YellowExclamationTriangleIcon,
  [AlertVariant.info]: BlueInfoCircleIcon,
  [AlertVariant.danger]: RedExclamationCircleIcon,
};

export const ReviewListTitle: React.FC<ReviewListTitleProps> = ({ text }) => (
  <dt>
    <TextContent className="ocs-install-wizard__text-content">
      <Text component={TextVariants.h3} className="ocs-install-wizard__h3 ">
        {text}
      </Text>
    </TextContent>
  </dt>
);

type ReviewListTitleProps = { text: string };

export const ReviewListBody: React.FC<ReviewListBodyProps> = ({
  children,
  validation,
  hideIcon = false,
  noValue = undefined,
}) => {
  const { t } = useTranslation();

  const alert = VALIDATIONS(validation, t);
  const Icon = noValue
    ? REVIEW_ICON_MAP[AlertVariant.danger]
    : REVIEW_ICON_MAP[alert?.variant || AlertVariant.success];

  return (
    <dd className="ocs-install-wizard__dd">
      {alert?.variant || !hideIcon ? (
        <Split>
          <SplitItem>
            <Icon className="ocs-install-wizard__icon" />
          </SplitItem>
          <SplitItem isFilled>
            {children}
            {alert?.variant ? <ValidationMessage validation={validation} /> : null}
          </SplitItem>
        </Split>
      ) : (
        children
      )}
    </dd>
  );
};

type ReviewListBodyProps = {
  children: React.ReactNode;
  hideIcon?: boolean;
  noValue?: boolean;
  validation?: ValidationType;
};

export const RequestErrors: React.FC<RequestErrorsProps> = ({ errorMessage, inProgress }) => (
  <>
    {errorMessage && <ErrorAlert message={errorMessage} />}
    {inProgress && <LoadingInline />}
  </>
);

type RequestErrorsProps = { errorMessage: string; inProgress: boolean };

export const NodesCard: React.FC<NodeCardProps> = ({ nodes }) =>
  !!nodes.length && (
    <Card isCompact isFlat component="div" className="ocs-install-wizard__card">
      <CardBody isFilled className="ocs-install-wizard__card-body">
        <TextContent>
          {nodes.map((node) => (
            <Text key={node.metadata.name} component={TextVariants.small}>
              {node.metadata.name}
            </Text>
          ))}
        </TextContent>
      </CardBody>
    </Card>
  );

type NodeCardProps = { nodes: NodeKind[] };
