import * as _ from 'lodash';
import { BuildStrategyType } from '@console/internal/components/build';
import {
  getResourcesType,
  getPageHeading,
  CreateApplicationFlow,
  getInitialValues,
  getExternalImagelValues,
} from '../edit-application-utils';
import { Resources } from '../../import/import-types';
import {
  knativeService,
  knAppResources,
  knExternalImageValues,
  appResources,
  gitImportInitialValues,
  externalImageValues,
  internalImageValues,
} from './edit-application-data';

describe('Edit Application Utils', () => {
  it('getResourcesType should return resource type based on resource kind', () => {
    expect(getResourcesType(knativeService)).toEqual(Resources.KnativeService);
  });

  it('getPageHeading should return page heading based on the create flow used to create the application', () => {
    expect(getPageHeading(BuildStrategyType.Source)).toEqual(CreateApplicationFlow.Git);
  });

  it('getInitialValues should return values based on the resources and the create flow used to create the application', () => {
    const { route, editAppResource, buildConfig, imageStream } = appResources;
    expect(
      getInitialValues({ buildConfig, editAppResource, route }, 'nationalparks-py', 'div'),
    ).toEqual(gitImportInitialValues);
    expect(
      getInitialValues({ editAppResource, route, imageStream }, 'nationalparks-py', 'div'),
    ).toEqual(externalImageValues);
    expect(getInitialValues({ editAppResource, route }, 'nationalparks-py', 'div')).toEqual(
      internalImageValues,
    );
  });

  it('getExternalImagelValues should return image name in search term', () => {
    const externalImageData = getExternalImagelValues(knativeService);
    expect(_.get(externalImageData, 'searchTerm')).toEqual('openshift/hello-openshift');
  });

  it('getInitialValues should return values externalImageValues on the resources', () => {
    const { route, editAppResource, imageStream } = knAppResources;
    expect(
      getInitialValues({ editAppResource, route, imageStream }, 'nationalparks-py', 'div'),
    ).toEqual(knExternalImageValues);
  });
});
