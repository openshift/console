export const pipelineRunDetailsObj = {
  pipelineRunDetails: 'div.odc-pipeline-run-details__customDetails dl',
  actions: '[data-test-id="actions-menu-button"]',
  details: {
    pipelineLink: '[data-test-id="git-pipeline-events"]'
  }
}

export const pipelineRunsObj = {
  pipelineRunsTable: {
    table: 'div[role="grid"]',
    pipelineRunName: 'tr td:nth-child(1)',
  }
}

export const pipelineRunDetailsPage = {
    verifyTitle:() => 
      cy.get('h2.co-section-heading span', {timeout:9000}).should('have.text', 'Pipeline Run Details'),
  
    verifyPipelineRunStatus:(status: string) => cy.get('span.co-resource-item__resource-status').should('have.text', status),
    fieldDetails:(fieldName: string, expectedFieldValue: string) => {
      cy.get(pipelineRunDetailsObj.pipelineRunDetails).each(($el) => {
        if($el.text().includes(fieldName)) {
          expect($el.next('dd').text()).equals(expectedFieldValue);
        }
      });
    },
    selectFromActionsDropdown:(action: string) => {
      cy.get(pipelineRunDetailsObj.actions).click();
      switch (action) {
        case 'Rerun': {
          cy.byTestActionID('Rerun').click();
          cy.get('[data-test-section-heading="Pipeline Run Details"]').should('be.visible');
          break;
        }
        case 'Delete Pipeline Run': {
          cy.byTestActionID('Delete Pipeline Run').click();
          cy.get('form').should('be.visible');
          cy.byLegacyTestID('modal-title').should('contain.text','Delete Pipeline?');
          break;
        }
        default: {
          throw new Error('operator is not available');
        }
      }
    },

    verifyTabs:() => {
      cy.get('ul.co-m-horizontal-nav__menu li a').as('tabName');
      cy.get('@tabName').eq(0).should('have.text', 'Details');
      cy.get('@tabName').eq(1).should('have.text', 'YAML');
      cy.get('@tabName').eq(2).should('have.text', 'Logs');
    },
    verifyFields:() => {
      cy.get('[data-test-id="resource-summary"] dt .details-item__label').as('fieldNames');
      cy.get('@fieldNames').eq(0).should('have.text', 'Name');
      cy.get('@fieldNames').eq(1).should('have.text', 'Namespace');
      cy.get('@fieldNames').eq(2).should('have.text', 'Labels');
      cy.get('@fieldNames').eq(3).should('have.text', 'Annotations');
      cy.get('@fieldNames').eq(4).should('have.text', 'Created At');
      cy.get('@fieldNames').eq(5).should('have.text', 'Owner');
      cy.get('div.odc-pipeline-run-details__customDetails dl dt').as('dynamicLinks')
      cy.get('@dynamicLinks').eq(0).should('have.text', 'Status');
      cy.get('@dynamicLinks').eq(1).should('have.text', 'Pipeline');
      cy.get('@dynamicLinks').eq(2).should('have.text', 'Triggered by:');
    },
    verifyActionsDropdown:() => cy.get(pipelineRunDetailsObj.actions).should('be.visible'),
    selectPipeline:() => cy.get(pipelineRunDetailsObj.details.pipelineLink, {timeout:3000}).click(),
  }

  export const pipelienRunsPage = {
    verifyTitle:() => cy.titleShouldBe('Pipeline Runs'),
    search:(pipelineRunName: string) => cy.byLegacyTestID('item-filter').type(pipelineRunName),
    selectKebabMenu:(pipelineRunName: string) => {
      cy.get(pipelineRunsObj.pipelineRunsTable.table).should('exist');
      cy.get(pipelineRunsObj.pipelineRunsTable.pipelineRunName).each(($el, index) => {
        const text = $el.text()
        if(text.includes(pipelineRunName)) {
          cy.get('tbody tr').eq(index).find('td:nth-child(7) button').click();
        }
      });
    },
    verifyPipelineRunsTableDisplay:() => cy.get(pipelineRunsObj.pipelineRunsTable.table).should('be.visible'),
    filterByStatus:(status: string = 'Succeeded') => {
      cy.byLegacyTestID('filter-dropdown-toggle').click();
      switch (status) {
        case 'Succeeded': {
          cy.get('#Succeeded').click();
          break;
        }
        case 'Running': {
          cy.get('#Running').click();
          break;
        }
        case 'Failed': {
          cy.get('#Failed').click();
          break;
        }
        case 'Cancelled': {
          cy.get('#Cancelled').click();
          break;
        }
        default: {
          throw new Error('operator is not available');
        }
      }
      cy.byButtonText('Clear all filters').should('be.visible');      
    }
    
  }