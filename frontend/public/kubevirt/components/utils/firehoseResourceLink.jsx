import React from 'react';

import { ResourceLink } from '../utils/okdutils';
import {
  PodModel,
} from '../../models/index';
import { DASHES } from '../utils/constants';

const FirehoseResourceLink = props => {
  if (props.loaded && !props.loadError) {
    const data = props.flatten(props.resources);
    const resource = props.filter ? props.filter(data) : data;
    if (resource) {
      const { name, namespace, uid } = resource.metadata;
      const kind = resource.kind || PodModel.kind;
      return <ResourceLink kind={kind} name={name} namespace={namespace} title={uid} />;
    }
  }
  return DASHES;
};

export default FirehoseResourceLink;
