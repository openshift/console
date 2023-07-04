import * as React from 'react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { ExternalLink } from '@console/internal/components/utils';

export type ExtensionCardProps = {
  icon: string;
  link: string;
  title: string;
  description: string;
  provider: string;
};

const ExtensionCard: React.FC<ExtensionCardProps> = ({
  icon,
  link,
  title,
  description,
  provider,
}) => {
  return (
    <Card>
      <CardTitle>
        <div className="odc-serverless-extensions-card-title">
          <div className="odc-serverless-extensions-card-title__icon">
            <span className="odc-serverless-extensions-logo__bg">
              <img className="odc-serverless-extensions-logo__img" src={icon} aria-hidden alt="" />
            </span>
          </div>
          <div className="odc-serverless-extensions-card-title__name">
            <h1 className="odc-serverless-extensions-card-title__name__link">
              <ExternalLink href={link} text={title} />
            </h1>
            <small className="odc-serverless-extension-provider text-muted">{provider}</small>
          </div>
        </div>
      </CardTitle>
      <CardBody>
        <p>{description}</p>
      </CardBody>
    </Card>
  );
};

export default ExtensionCard;
