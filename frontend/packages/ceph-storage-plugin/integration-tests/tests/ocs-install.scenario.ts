import { $, browser, ExpectedConditions as until, element , by} from 'protractor';
import {appHost} from '@console/internal-integration-tests/protractor.conf';
import {isLoaded} from '../../../../integration-tests/views/crud.view';
import {click} from '../../../console-shared/src/test-utils/utils';
import * as sidenavView from '../../../../integration-tests/views/sidenav.view'
import * as crudView from '../../../../integration-tests/views/crud.view';
import {operatorModalInstallBtn} from '../../../operator-lifecycle-manager/integration-tests/views/operator-hub.view'
// import {isLoaded as yamlIsLoaded} from '../../views/yaml.view'

describe("OCS install scenario", () => {

    beforeAll(async () => {
        await browser.get(`${appHost}/dashboards`);
        await isLoaded;
        // await browser.wait(until.visibilityOf(sidenavView.navSectionFor('Operators')));
        // click(sidenavView.navSectionFor('Operators'))
        console.log("before clicking operatorhub");
        await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
        await crudView.isLoaded();
        console.log("after clicking operatorhub");
        
        
    });
    it('Expect ocs to be on operatorhub', async ()=> {
       
        
        
        
        click(element(by.css('.pf-c-dropdown__toggle.pf-m-plain')));
        console.log("after clicking namespaces");
        
        click(element(by.css('#openshift-storage-link')));
        console.log("after clicking openshift-storage namespace")
        
        
        click(element(by.cssContainingText('.vertical-tabs-pf-tab a','Storage')));
        console.log("after clicking storage");
        
    



        click(element(by.cssContainingText('.catalog-tile-pf-title','Openshift Container Storage Operator')));
        console.log("after clicking ocs");
        

        click(operatorModalInstallBtn);
        
        console.log('after clicking install');
        
        click($('input[value="OwnNamespace"]'));
        console.log("after clicking own namespace");
        
        click(element(by.id('dropdown-selectbox')));
        console.log("after clicking namespace dropdown");
        
        click(element(by.id('openshift-storage-Project-link')));
        console.log("after choosing openshift storage");
        
        click($('input[value="Automatic"]'));
        console.log("after pressing automatic approval strategy")
        
        click(element(by.cssContainingText('.pf-c-button','Subscribe')));
        console.log("after clicking subscribe");
        jasmine.DEFAULT_TIMEOUT_INTERVAL=120000;
        console.log("Before waiting 60 seconds");
        await browser.sleep(60000);
        console.log("After waiting 60 seconds");
        
        // await browser.wait(until.textToBePresentInElement(rowForName('Openshift Container Storage Operator').$('span[class="co-icon-and-text"]'),'InstallSucceeded'),90000);
        click(element(by.cssContainingText('.co-clusterserviceversion-logo','Openshift Container Storage Operator')),20000);  
        console.log("After clicking ocs on installed operators");
        // await rowForName('Openshift Container Storage Operator').element(by.linkText('Openshift Container Storage Operator')).click();
        await browser.sleep(1000);
        click(element(by.cssContainingText('a','Storage Cluster')));
        click(element(by.cssContainingText('button','Create OCS Cluster Service')));
        // await browser.sleep(10000);
        // const table = $('.pf-c-table.pf-m-compact tbody');
        // const rows = table.$$('tr');
        // const workerNodes = rows.filter((row) => row.$('[data-label="Role"]').getText().then((text) => text === 'worker')    );
        // console.log(workerNodes);



        await browser.wait(until.presenceOf($('[data-label="Role"]')), 10000);
        const table = $('.pf-c-table.pf-m-compact tbody');
        // console.log(JSON.stringify(await table.getText()));
        // var checkbox = table.$$('input[aria-labelledby="simple-node0"]');
        
        
        var rows = table.$$('tr');
        
        // console.log(JSON.stringify(await checkbox));
        console.log(JSON.stringify(await rows.getText()));
    
        // const workerNodesRows = rows.filter((row) => row.$('[data-label="Role"]').getText().then((text) => text === 'worker')    );
        
        // console.log(JSON.stringify(await workerNodesRows.getText()));
    
        
        var workerAz = new Array();
        
        rows.each(async (row,index) => {
            // console.log(JSON.stringify(await row.getText())+" "+index);
            var currRow = JSON.stringify(await row.getText());
            // console.log(currRow);
            var newCurrRow = currRow.replace(/\\n/g, " ");
            // console.log("after remove \n "+newCurrRow);
            var splitedRow = new Array();
            splitedRow = newCurrRow.split(/\s/g);
            if (splitedRow[3] === 'worker') {
                console.log(splitedRow);
                var notInAZ = true;
                if (workerAz.length>0) {
                    // for (const [xindex,az] of workerAz.entries()){
                        for (let az of workerAz) {
                            if (splitedRow[4]===az ) {
                                console.log(splitedRow[4]+" "+az);
                                notInAZ=false;
                                break;
                            } 
                    
                        };
                }
            }
            if (notInAZ===true) {
                workerAz.push(splitedRow[4]);
                
                
                table.$$('input').get(index).click();
            }
            browser.sleep(20000);
           
    
        });
    
    

});




     

});