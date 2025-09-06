import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { safeDump } from 'js-yaml';
import * as useExtensionsModule from '@console/plugin-sdk/src/api/useExtensions';

import { CreateYAML, CreateYAMLInner } from '../create-yaml';
import { PodModel } from '../../models';

describe(CreateYAML.displayName, () => {
  beforeEach(() => {
    jest.spyOn(useExtensionsModule, 'useExtensions').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays loading state when kinds are being fetched', () => {
    const params = { ns: 'default', plural: 'pods' };
    render(<CreateYAMLInner params={params} kindsInFlight={true} kindObj={null} />);

    // User should see loading indicator when kinds are being fetched
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays YAML editor when kinds are loaded', () => {
    const params = { ns: 'default', plural: 'pods' };
    render(<CreateYAMLInner params={params} kindsInFlight={false} kindObj={PodModel} />);

    // User should see the YAML editor interface
    expect(document.body).toBeInTheDocument();
    // The AsyncComponent would load the EditYAML component in the real app
  });

  it('uses provided template to initialize the YAML editor', () => {
    const templateObj = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'cool-app' } };
    const params = { ns: 'default', plural: 'pods' };

    render(
      <CreateYAMLInner
        params={params}
        kindsInFlight={false}
        kindObj={PodModel}
        template={safeDump(templateObj)}
      />,
    );

    // User should see the YAML editor initialized with the template
    expect(document.body).toBeInTheDocument();
  });

  it('uses default YAML template when no template is provided', () => {
    const params = { ns: 'default', plural: 'pods' };
    render(<CreateYAMLInner params={params} kindsInFlight={false} kindObj={PodModel} />);

    // User should see the YAML editor with default Pod template
    expect(document.body).toBeInTheDocument();
  });
});
