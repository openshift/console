import { browser } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import { dashboardIsLoaded } from '@console/shared/src/test-views/dashboard-shared.view';
import { greenCheckMarkColor } from '../views/status-health-check.view';

describe('Check data on Persistent Storage Dashboard.', () => {
    beforeAll(async () => {
      await browser.get(`${appHost}/dashboards`);
      await dashboardIsLoaded();
    });
    it('Check main dashboard health is green', () => {
        expect(greenCheckMarkColor.isPresent()).toBe(true);
      });
    

    
    
    

    


















});