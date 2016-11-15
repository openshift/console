import _ from 'lodash';

import {angulars} from '../../components/react-wrapper';

export const util = {
  getKindEnumById: id => _.find(angulars.kinds, {id: id}),

  // Set all named properties of object to null if empty.
  nullifyEmpty: (obj, props) => {
    props.forEach(function(p) {
      if (_.isEmpty(obj[p])) {
        obj[p] = null;
      }
    });
  },

  deleteProps: (obj, fn) => {
    _.forEach(obj, function(val, key) {
      if (fn(val)) {
        delete obj[key];
      }
    });
    return obj;
  },

  deleteNulls: (obj) => {
    util.deleteProps(obj, _.isNull);
    return obj;
  },

  // The detail page link of a resource.
  getLink: (resource, kind) => {
    var meta, path = '';
    if (!resource || !resource.metadata) {
      return '';
    }
    meta = resource.metadata;
    if (meta.namespace) {
      path = `ns/${meta.namespace}/`;
    }
    return `${path}${kind.path}/${meta.name}`;
  },

  // The edit page link of a resource.
  getEditLink: (resource, kind) => {
    var link = util.getLink(resource, kind);
    if (!link) {
      return '';
    }
    return `${link}/edit`;
  },
};
