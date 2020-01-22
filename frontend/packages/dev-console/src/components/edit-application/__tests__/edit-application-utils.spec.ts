import { BuildStrategyType } from '@console/internal/components/build';
import {
  getResourcesType,
  getPageHeading,
  CreateApplicationFlow,
  getInitialValues,
} from '../edit-application-utils';
import { Resources } from '../../import/import-types';
import {
  knativeService,
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
});
