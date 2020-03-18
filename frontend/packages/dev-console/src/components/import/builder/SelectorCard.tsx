import * as React from 'react';
import * as classNames from 'classnames';
import { Card, CardHeader, CardBody } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { BuilderImage } from '../../../utils/imagestream-utils';

import './SelectorCard.scss';

export interface SelectorCardProps {
  image: BuilderImage;
  selected: boolean;
  recommended?: boolean;
  onChange: (name: string) => void;
}

const SelectorCard: React.FC<SelectorCardProps> = ({
  image,
  selected,
  recommended = false,
  onChange,
}) => {
  const classes = classNames('odc-selector-card', { 'is-selected': selected });
  return (
    <Card
      component="button"
      type="button"
      aria-label={image.title}
      className={classes}
      onClick={() => onChange(image.name)}
    >
      <CardHeader>
        <img className="odc-selector-card__icon" src={image.iconUrl} alt={image.displayName} />
      </CardHeader>
      <CardBody>
        <span className="odc-selector-card__title">{image.title}</span>
      </CardBody>
      {recommended && (
        <span className="odc-selector-card__recommended">
          <StarIcon />
        </span>
      )}
    </Card>
  );
};

export default SelectorCard;
