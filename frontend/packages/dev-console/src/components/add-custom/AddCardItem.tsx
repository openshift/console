import * as React from 'react';
import { SimpleListItem, Title, Text, Label } from '@patternfly/react-core';
import InfoCircleIcon from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { ResolvedExtension, AddAction } from '@console/dynamic-plugin-sdk';
import { useToast } from '@console/shared/src';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { navigateTo, resolvedHref } from '../../utils/add-page-utils';
import { useShowAddCardItemDetails } from './hooks/useShowAddCardItemDetails';
import './AddCardItem.scss';

type AddCardItemProps = {
  action: ResolvedExtension<AddAction>;
  namespace: string;
};

type GuideLinksType = { id: string; url: string }[];

const AddCardItem: React.FC<AddCardItemProps> = ({
  action: {
    properties: { id, label, icon, href: listItemHref, callback, description },
  },
  namespace,
}) => {
  const fireTelemetryEvent = useTelemetry();
  const [showDetails] = useShowAddCardItemDetails();
  const toast = useToast();
  const [guideLinks, setGuideLinks] = React.useState<GuideLinksType | null>(null);

  const handleLink = (e) => {
    e.preventDefault();
    // Prevents event from bubbling up to parent
    e.stopPropagation();
    const { href } = e.target;
    window.open(href, '_blank');
  };

  const getTutorialUrls = (idTutorial: string): string => {
    if (guideLinks) {
      const resultItem = guideLinks.find((url) => url.id === idTutorial);
      return resultItem ? resultItem.url : '#';
    }
    return '#';
  };

  React.useEffect(() => {
    try {
      const { tutorialUrls } = window.SERVER_FLAGS;
      const tutorialUrlsParser = JSON.parse(tutorialUrls);
      setGuideLinks(tutorialUrlsParser.sections);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse tutorial URLs', error);
    }
  }, []);

  const actionIcon = (): JSX.Element => {
    if (typeof icon === 'string') {
      return (
        <img
          className="odc-add-card-item__icon odc-add-card-item__img-icon"
          src={icon}
          alt={label}
          aria-hidden="true"
        />
      );
    }
    if (typeof icon !== 'string' && React.isValidElement(icon)) {
      return (
        <span className="odc-add-card-item__icon" aria-hidden="true">
          {icon}
        </span>
      );
    }
    return null;
  };

  return (
    <SimpleListItem
      component="a"
      componentProps={{
        'data-test': `item ${id}`,
      }}
      href={listItemHref ? resolvedHref(listItemHref, namespace) : null}
      onClick={(e: React.SyntheticEvent) => {
        fireTelemetryEvent('Add Item Selected', {
          id,
          name: label,
        });
        if (listItemHref) {
          navigateTo(e, resolvedHref(listItemHref, namespace));
        } else if (callback) {
          callback({ namespace, toast });
        }
      }}
      className="odc-add-card-item"
    >
      <Title headingLevel="h3" size="lg" className="odc-add-card-item__title" data-test="title">
        {label}
      </Title>
      <Label
        href={getTutorialUrls(`add-${id}`)}
        onClick={handleLink}
        className="pf-c-label-md"
        color="blue"
        icon={<InfoCircleIcon />}
      >
        Cloud Doc
      </Label>

      {showDetails && (
        <Text className="odc-add-card-item__description" data-test="description">
          {actionIcon()}
          {description}
        </Text>
      )}
    </SimpleListItem>
  );
};

export default AddCardItem;
