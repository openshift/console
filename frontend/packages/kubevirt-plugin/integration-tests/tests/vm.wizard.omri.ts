import { browser, ExpectedConditions as until } from 'protractor';
import { click } from '@console/shared/src/test-utils/utils';
import * as _ from 'lodash';
import * as view from '../../integration-tests/views/wizard.view'
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { isLoaded, createItemButton } from '../../../../integration-tests/views/crud.view';
import { Wizard } from './models/wizard';
import { Flavor, OperatingSystem, Workload } from './utils/constants/wizard';
import { ProvisionSource } from './utils/constants/enums/provisionSource';

import { getRandStr } from './utils/utils';
import { FlavorConfig } from './types/types';


describe('Kubevirt create VM using wizard (omri)', () => {

    const customFlavorSufficientMemory: FlavorConfig = {
        flavor: Flavor.CUSTOM,
        cpu: '1',
        memory: '5',
        };

        
  it('ICNV-5045 - dont let the user continue If PXE provision source is selected on a cluster without a NAD available', async () => {
    await browser.get(`${appHost}/k8s/ns/${testName}/virtualization`);
    await isLoaded();
    await click(createItemButton);
    await click(view.createWithWizardButton);
    await view.waitForNoLoaders();
    const wizard = new Wizard();
    await wizard.fillName(getRandStr(5));
    
    await wizard.selectProvisionSource(ProvisionSource.PXE);
  
    await wizard.selectOperatingSystem(OperatingSystem.RHEL7);
    await wizard.selectFlavor(customFlavorSufficientMemory);
    await wizard.selectWorkloadProfile(Workload.DESKTOP);
    await click(view.nextButton);
    await browser.wait(until.presenceOf(view.footerError), 1000);
  });
})
