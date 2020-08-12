import {displayOptions, nodeActions} from '../constants/topology';
import { helmPage } from './helm_page';

export const topologyObj = {
    switcher: '[data-test-id="namespace-bar-dropdown"] a',
    graph: {
        reset: '#reset-view',
        zoomIn: '#zoom-in',
        zoomOut: '#zoom-out',
        fitToScreen: '#fit-to-screen',
    }, 
    list: {
        appName: '#HelmRelease ul li div',
        nodeName: '#HelmRelease ul li div',
    },
    sidePane: {
        dialog: '[role="dialog"]',
        title: '[role="dialog"] h1',
        tabs: '[role="dialog"] li button',
        sectionTitle:'[role="dialog"] h2',
        close: 'button[aria-label="Close"]',
    }
}

export const topologyPage = {
    verifyTopologyPage: () => {
        cy.get('.co-m-loader').should('not.be.visible');
        cy.get(topologyObj.graph.reset, {timeout:9000}).should('be.visible');
    },
    verifyContextMenu:() => {
        cy.get('#popper-container ul').should('be.visible');
    },
    verifyNoWorkLoadsText:(text: string) => cy.get('h2.co-hint-block__title').should('contain.text', text),
    verifyWorkLoads:() => cy.get('g[data-surface="true"]').should('be.visible'),
    search: (name: string)=> cy.byLegacyTestID('item-filter').clear().type(name),
    verifyWorkloadInTopologyPage: (appName: string) => {
        cy.get(topologyObj.switcher).as('switcher');
        cy.get('@switcher').click();
        topologyPage.search(appName);
        // cy.get(topologyObj.list.nodeName).should('contain.text', appName);
        cy.get('div.is-filtered').should('be.visible');
        cy.get('@switcher').click();
    },
    clicKDisplayOptionDropdown:() => cy.get('[id^=pf-select-toggle-id]').contains('Display Options').click(),
    selectDisplayOption: (opt: displayOptions) => {
        topologyPage.clicKDisplayOptionDropdown();
        switch (opt) {
            case displayOptions.PodCount:
                cy.get('#pf-random-id-1-show-pod-count').check();
                break;
            case displayOptions.Labels:
                cy.get('#pf-random-id-1-show-labels').check();
                break;
            case displayOptions.ApplicationGroupings:
                cy.get('#pf-random-id-1-expand-app-groups').check();
                break;
            default:
                throw new Error('Option is not available');
                break;
            }
    },
    filterByResource:(resourceName: string) => {
        cy.get('[id^=pf-select-toggle-id]').contains('Filter by Resource').click();
        cy.get(`[id$="${resourceName}"]`).check();
    },
    verifyPipelineRunStatus:(status:string) => cy.get('li.list-group-item.pipeline-overview').next('li').find('span.co-icon-and-text span').should('have.text', status),
    searchHelmRelease:(name: string) => {
        topologyPage.search(name);
        cy.get('[data-kind="node"]', {timeout: 8000}).then(($el) => {
            if($el.find('g.is-filtered').length === 0) {
                helmPage.createHelmRelease(name);
                cy.get('[data-kind="node"] g.is-filtered', {timeout: 8000}).should('be.visible');
            }
            else {
                cy.log('Helm Release is already available');
                cy.get('[data-kind="node"] g.is-filtered', {timeout: 8000}).should('be.visible');
            }
        });
    },
    verifyHelmReleaseSidePaneTabs:() => {
        cy.get(topologyObj.sidePane.tabs).eq(0).should('contain.text', 'Details');
        cy.get(topologyObj.sidePane.tabs).eq(1).should('contain.text', 'Resources');
        cy.get(topologyObj.sidePane.tabs).eq(2).should('contain.text', 'Release Notes');
    },
    appNode:(appName:string) => {
        return cy.get(`[data-id="group:${appName}"] g.odc-resource-icon text`).contains('A').parent('g').next('text').contains(appName);
    },
    componentNode:(nodeName:string) => {
        return cy.get('g.odc-base-node__label > text').contains(nodeName).parent('[data-test-id="base-node-handler"]');
        // let ele;
        // cy.get(`g.odc-base-node__label > text`).each(($el, index) => {
        //     if($el.mouseover().text().includes(nodeName)) {
        //         ele = cy.get(`g.odc-base-node__label > text`).eq(index)
        //     }
        // });
        // return ele;
    },
    verifyContextMenuOptions:(...options: string[]) => {
        cy.get('#popper-container li[role="menuitem"]').each(($el) => {
            expect(options).contains($el.text());
        });
    },
    clickContextMenuOption:(menuOption: string) => {
        cy.get('#popper-container li[role="menuitem"]').contains(menuOption).click();
    },
    verifyDecorators:(nodeName: string, numOfDecorators: number) => {
        topologyPage.componentNode(nodeName).siblings('a').should('have.length', numOfDecorators);
    },
}

export const topologySidePane = {
    verify: () => cy.get(topologyObj.sidePane.dialog).should('be.visible'),
    verifyTitle:(nodeName: string) => cy.get(topologyObj.sidePane.title).should('contain', nodeName),
    verifySelectedTab:(tabName: string) => cy.get(topologyObj.sidePane.tabs).contains(tabName).parent('li').should('have.class', 'co-m-horizontal-nav-item--active'),
    verifyTab:(tabName: string) => cy.get(topologyObj.sidePane.tabs).contains(tabName).should('be.visible'),
    selectTab:(tabName: string) => cy.get(topologyObj.sidePane.tabs).contains(tabName).click(),
    verifySection:(sectionTitle: string) => cy.get(topologyObj.sidePane.sectionTitle).contains(sectionTitle).should('be.visible'),
    verifyActions:(...actions: string[]) => {
        cy.get('[data-test-id="action-items"] li').each(($el) => {
            expect(actions).contains($el.text());
        });
    },
    verifyWorkload:() => cy.get('[role="dialog"] h2').contains('Services').next('ul li a').should('be.visible'),
    verifyFieldValue:(fieldName: string, fieldValue: string) => cy.get(`[data-test-selector="details-item-value__${fieldName}"]`).should('contain.text', fieldValue),
    selectAddHealthChecks:() => cy.get('a').contains('Add Health Checks').click(),
    // selectActionFromMenu:(actionMenuOption: string) => cy.selectActionsMenuOption(actionMenuOption),
    selectNodeAction:(action: nodeActions | string)=> {
        switch (action) {
          case 'Edit Application Grouping':
          case nodeActions.EditApplicatoinGrouping: {
            cy.selectActionsMenuOption(action);
            break;
          }
          case 'Edit Pod Count':
          case nodeActions.EditPodCount: {
            cy.selectActionsMenuOption(action);
            break;
          }
          case 'Edit Labels':
          case nodeActions.EditLabels: {
            cy.selectActionsMenuOption(action);
            cy.get('form').should('be.visible');
            cy.alertTitleShouldBe('Edit Labels');
            break;
          }
          case 'Edit Annotations':
          case nodeActions.EditAnnotations: {
            cy.selectActionsMenuOption(action);
            cy.get('form').should('be.visible');
            cy.alertTitleShouldBe('Edit Annotations');
            break;
          }
          case 'Edit Update Strategy':
          case nodeActions.EditUpdateStrategy: {
            cy.selectActionsMenuOption(action);
            break;
          }
          case 'Delete Deployment':
          case nodeActions.DeleteDeployment: {
            cy.selectActionsMenuOption(action);
            break;
          }
          default: {
            throw new Error('operator is not available');
          }
        }
    },
}

export const addHealthChecksObj = {
    readinessProbe: {
        requestType: '#form-dropdown-healthChecks-readinessProbe-data-requestType-field',
        httpHeaderName: 'input[placeholder="header name"]',
        httpHeaderValue: 'input[placeholder="value"]',
        path: '#form-input-healthChecks-readinessProbe-data-httpGet-path-field',
        port: '#form-input-healthChecks-readinessProbe-data-httpGet-port-field',
        failureThreshold: '#form-input-healthChecks-readinessProbe-data-failureThreshold-field',
        successThreshold: '#form-input-healthChecks-readinessProbe-data-successThreshold-field',
        initialDelay: '#form-input-healthChecks-readinessProbe-data-initialDelaySeconds-field',
        period: '#form-input-healthChecks-readinessProbe-data-periodSeconds-field',
        timeout: '#form-input-healthChecks-readinessProbe-data-timeoutSeconds-field',
    },
    livenessProbe: {
        requestType: '#form-dropdown-healthChecks-livenessProbe-data-requestType-field',
        httpHeaderName: 'input[placeholder="header name"]',
        httpHeaderValue: 'input[placeholder="value"]',
        path: '#form-input-healthChecks-livenessProbe-data-httpGet-path-field',
        port: '#form-input-healthChecks-livenessProbe-data-httpGet-port-field',
        failureThreshold: '#form-input-healthChecks-livenessProbe-data-failureThreshold-field',
        successThreshold: '#form-input-healthChecks-livenessProbe-data-successThreshold-field',
        initialDelay: '#form-input-healthChecks-livenessProbe-data-initialDelaySeconds-field',
        period: '#form-input-healthChecks-livenessProbe-data-periodSeconds-field',
        timeout: '#form-input-healthChecks-livenessProbe-data-timeoutSeconds-field',        
    },
    startupProbe: {
        requestType: '#form-dropdown-healthChecks-startupProbe-data-requestType-field',
        httpHeaderName: 'input[placeholder="header name"]',
        httpHeaderValue: 'input[placeholder="value"]',
        path: '#form-input-healthChecks-startupProbe-data-httpGet-path-field',
        port: '#form-input-healthChecks-startupProbe-data-httpGet-port-field',
        failureThreshold: '#form-input-healthChecks-startupProbe-data-failureThreshold-field',
        successThreshold: '#form-input-healthChecks-startupProbe-data-successThreshold-field',
        initialDelay: '#form-input-healthChecks-startupProbe-data-initialDelaySeconds-field',
        period: '#form-input-healthChecks-startupProbe-data-periodSeconds-field',
        timeout: '#form-input-healthChecks-startupProbe-data-timeoutSeconds-field',
    },
    add: '[data-test-id="submit-button"]',
    cancel: '[data-test-id="reset-button"]',
}

export const addHealthChecksPage = {
    verifyTitle: () => cy.titleShouldBe('Add Health Checks'),
    addReadinessProbe:() => {
        cy.byButtonText('Add Readiness Probe').click();
        
    },
    clickCheckIcon:() => cy.byLegacyTestID('check-icon').click(),
    clickCancelIcon:() => cy.byLegacyTestID('close-icon').click(),
}
