import * as React from 'react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import * as classNames from 'classnames';
import './SelectorCard.scss';

interface SelectorCardProps {
  title: string;
  iconUrl: string;
  name: string;
  selected?: boolean;
  recommended?: boolean;
  onChange: (name: string) => void;
}

const SelectorCard: React.FC<SelectorCardProps> = ({
  title,
  iconUrl,
  name,
  selected,
  recommended = false,
  onChange,
}) => {
  const classes = classNames('odc-selector-card', { 'is-selected': selected });
  return (
    <Card component="button" type="button" className={classes} onClick={() => onChange(name)}>
      <CardTitle>
        <img className="odc-selector-card__icon" src={iconUrl} alt="" />
      </CardTitle>
      <CardBody>
        <span className="odc-selector-card__title">{title}</span>
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
