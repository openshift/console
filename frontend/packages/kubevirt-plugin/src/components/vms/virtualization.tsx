import * as React from 'react';
import { Helmet } from 'react-helmet';
import { compose } from 'redux';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared';
import { HorizontalNav } from '@console/internal/components/utils';
import { withStartGuide } from '@console/internal/components/start-guide';
import { VirtualMachinesPage } from './vm';
import { VirtualMachineTemplatesPage } from '../vm-templates/vm-template';
import { VirtualMachineModel } from '../../models';

export const WrappedVirtualizationPage: React.FC<VirtualizationPageProps> = (props) => {
  const title = 'Virtualization';

  const obj = { loaded: true, data: { kind: VirtualMachineModel.kind } };
  const pages = [
    {
      href: '',
      name: 'Virtual Machines',
      component: VirtualMachinesPage,
    },
  ];

  if (props.flags[FLAGS.OPENSHIFT]) {
    pages.push({
      href: 'templates',
      name: 'Virtual Machine Templates',
      component: VirtualMachineTemplatesPage,
    });
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading" data-test-id="cluster-settings-page-heading">
          {title}
        </h1>
      </div>
      <HorizontalNav
        {...props}
        pages={pages}
        match={props.match}
        obj={obj}
        customData={{ showTitle: false }}
      />
    </>
  );
};

type VirtualizationPageProps = {
  match: any;
  skipAccessReview?: boolean;
  noProjectsAvailable?: boolean;
  flags: FlagsObject;
};

const VirtualizationPage = withStartGuide(
  compose(connectToFlags(FLAGS.OPENSHIFT))(WrappedVirtualizationPage),
);

export { VirtualizationPage };
