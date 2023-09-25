import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSelector } from 'react-redux';
import { inject, processReduxId } from '@console/internal/components/utils';

const worstError = (errors) => {
  let worst = errors && errors[0];
  for (const e of errors) {
    if (e.status === 403) {
      return e;
    }
    if (e.status === 401) {
      worst = e;
    }
    if (e.status > worst.status) {
      worst = e;
    }
  }
  return worst;
};

const ListPropProvider = (props) => {
  const k8sData: ImmutableMap<string, any> = useSelector(({ k8s }) => k8s);
  const reduxes = props.resources.map(({ prop, isList, filters, optional, kind }) => {
    return {
      reduxID: props.reduxIDs[0],
      prop,
      isList,
      filters,
      optional,
      kind,
    };
  });
  const resources: any = {};
  reduxes.forEach((redux) => {
    resources[redux.prop] = processReduxId({ k8s: k8sData }, redux);
  });
  const required = _.filter(resources, (r) => !r.optional);
  const loaded = _.every(resources, (resource) =>
    resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
  );
  const loadError = worstError(_.map(required, 'loadError').filter(Boolean));

  const k8sResults = Object.assign({}, resources, {
    filters: Object.assign({}, ..._.map(resources, 'filters')),
    loaded,
    loadError,
    reduxIDs: _.map(reduxes, 'reduxID'),
    resources,
  });
  return (
    <>
      {inject(props.children, {
        ...props,
        ...props?.data,
        ...k8sResults,
      })}
    </>
  );
};

export default ListPropProvider;
