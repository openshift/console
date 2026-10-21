import { yamlEditor } from '@console/dev-console/integration-tests/support/pages';
import { eventingPO } from '../../pageObjects/global-po';

export const createEventPage = {
  clearYAMLEditor: () => {
    cy.get(eventingPO.yamlEditor).click().focused().type('{ctrl}a').clear();
  },
  setYAMLContent: (yamlLocation: string) => {
    cy.readFile(yamlLocation).then((str) => {
      yamlEditor.setEditorContent(str);
    });
  },
};

export const createCamelKSourceEvent = (optionName: string) => {
  switch (optionName) {
    case 'AWS SQS Source':
      cy.get(eventingPO.awsSqsSource.accessKey).type('accessKey');
      cy.get(eventingPO.awsSqsSource.queueName).type('queueNameOrArn');
      cy.get(eventingPO.awsSqsSource.region).type('awsRegion');
      cy.get(eventingPO.awsSqsSource.secretKey).type('secretKey');
      cy.get(eventingPO.radioButtonresourceURI).click();
      cy.get(eventingPO.resourceURI).type('http://cluster.example.com/svc');
      cy.get(eventingPO.createConnector).click();
      break;

    case 'Salesforce Source':
      cy.get(eventingPO.saleforceSource.clientId).type('clientID');
      cy.get(eventingPO.saleforceSource.clientSecret).type('clientSecret');
      cy.get(eventingPO.saleforceSource.password).type('password');
      cy.get(eventingPO.saleforceSource.query).type('query');
      cy.get(eventingPO.saleforceSource.topicName).type('topicName');
      cy.get(eventingPO.saleforceSource.userName).type('userName');
      cy.get(eventingPO.radioButtonresourceURI).click();
      cy.get(eventingPO.resourceURI).type('http://cluster.example.com/svc');
      cy.get(eventingPO.createConnector).click();
      break;

    case 'AWS Kinesis Source':
      cy.get(eventingPO.awsKinesisSource.accessKey).type('accesskey');
      cy.get(eventingPO.awsKinesisSource.region).type('awsregion');
      cy.get(eventingPO.awsKinesisSource.secretKey).type('secretkey');
      cy.get(eventingPO.awsKinesisSource.stream).type('streamName');
      cy.get(eventingPO.radioButtonresourceURI).click();
      cy.get(eventingPO.resourceURI).type('http://cluster.example.com/svc');
      cy.get(eventingPO.createConnector).click();
      break;

    case 'Jira Source':
      cy.get(eventingPO.jiraSource.jiraURL).type('jiraUrl');
      cy.get(eventingPO.jiraSource.password).type('password');
      cy.get(eventingPO.jiraSource.userName).type('username');
      cy.get(eventingPO.jiraSource.jql).type('jql');
      cy.get(eventingPO.radioButtonresourceURI).click();
      cy.get(eventingPO.resourceURI).type('http://cluster.example.com/svc');
      cy.get(eventingPO.createConnector).click();
      break;

    case 'Slack Source':
      cy.get(eventingPO.slackSource.channel).type('channel');
      cy.get(eventingPO.slackSource.token).type('token');
      cy.get(eventingPO.radioButtonresourceURI).click();
      cy.get(eventingPO.resourceURI).type('http://cluster.example.com/svc');
      cy.get(eventingPO.createConnector).click();
      break;

    case 'Telegram Source':
      cy.get(eventingPO.telegramSource.authToken).type('authorizationToken');
      cy.get(eventingPO.radioButtonresourceURI).click();
      cy.get(eventingPO.resourceURI).type('http://cluster.example.com/svc');
      cy.get(eventingPO.createConnector).click();
      break;

    default:
      break;
  }
};
