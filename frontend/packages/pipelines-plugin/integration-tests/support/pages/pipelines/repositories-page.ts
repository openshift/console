import { pipelinesPO } from '../../page-objects';

export const repositoriesPage = {
  verifyRepositoryTableColumns: () => {
    cy.get('[role="grid"] tr th').each(($el) => {
      expect([
        'Name',
        'Event type',
        'Last run',
        'Task status',
        'Last run status',
        'Last run time',
        'Last run duration',
        '',
      ]).toContain($el.text());
    });
  },

  verifyNameInRepositoriesTable: (repoName: string) => {
    cy.get(pipelinesPO.search)
      .clear()
      .type(repoName);
    cy.get('[title="Repository"]')
      .next('a')
      .then(($el) => {
        expect($el.text()).toMatch(repoName);
      });
  },
};
