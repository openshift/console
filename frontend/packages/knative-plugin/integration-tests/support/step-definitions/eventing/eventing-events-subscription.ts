import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import {
  addOptions,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import {
  addPage,
  navigateTo,
  eventsPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';

Given('user has updated the knative-eventing CM to enable the eventtype auto create', () => {
  cy.exec(
    `oc patch configmap config-features -p '{"data": {"eventtype-auto-create": "enabled"}}' -n knative-eventing`,
    {
      failOnNonZeroExit: false,
      timeout: 3000,
    },
  ).then((result) => {
    if (result.stdout.includes('patched')) {
      cy.log(`Success: ${result.stdout}`);
    } else {
      cy.log(`Error: ${result.stderr}`);
    }
  });
});

Given(
  'user creates {string} via the CLI in the namespace {string}',
  (resource: string, namespace: string) => {
    if (resource === 'KnativeService') {
      cy.exec(
        `oc apply -n ${namespace} -f support/testData/installation-yamls/createKnativeService.yaml`,
        {
          failOnNonZeroExit: false,
          timeout: 10000,
        },
      ).then((result) => {
        if (result.stdout.includes('created')) {
          cy.log(`Success: ${result.stdout}`);
        } else {
          cy.log(`Error: ${result.stderr}`);
        }
      });
    }

    if (resource === 'Broker') {
      cy.exec(`oc apply -n ${namespace} -f support/testData/installation-yamls/createBroker.yaml`, {
        failOnNonZeroExit: false,
        timeout: 10000,
      }).then((result) => {
        if (result.stdout.includes('created')) {
          cy.log(`Success: ${result.stdout}`);
        } else {
          cy.log(`Error: ${result.stderr}`);
        }
      });
    }
  },
);

Given('user sends an event to the Broker in the namespace {string}', (namespace: string) => {
  cy.exec(
    `oc run curl -n ${namespace} --image=quay.io/curl/curl:latest --rm=true --restart=Never -ti \
  -- -X POST -v \
  -H "content-type: application/json" \
  -H "ce-specversion: 1.0" \
  -H "ce-source: my/curl/command" \
  -H "ce-type: com.corp.integration.warning" \
  -H "ce-id: 6cf17c7b-30b1-45a6-80b0-4cf58c92b947" \
  -d '{"name":"Knative Demo"}' \
  http://broker-ingress.knative-eventing.svc.cluster.local/${namespace}/my-broker`,
    {
      failOnNonZeroExit: false,
      timeout: 10000,
    },
  ).then((result) => {
    cy.log(result.stdout || result.stderr);
  });
});

When('user clicks on Events card', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Events);
});

When('user clicks on {string} card in Events page', (cardName: string) => {
  eventsPage.search(cardName);
  eventsPage.clickEventType(cardName);
});

When('user clicks on Subscribe on the sidebar', () => {
  eventsPage.clickSubscribeOnSidePane();
});

When('user sees the Subscribe form', () => {
  eventsPage.verifySubscribeForm();
});

When('user enters name as {string} in the Subscribe Form', (name: string) => {
  eventsPage.enterTriggerName(name);
});

When('user clicks on the Subscriber dropdown and selects {string}', (subscriberName: string) => {
  eventsPage.selectSubscriber(subscriberName);
});

When('user clicks on Add more to add new pair {string}:{string}', (name: string, value: string) => {
  eventsPage.addAttribute(name, value);
});

When('user clicks the Subscribe button', () => {
  eventsPage.clickSubscribeButton();
});

Then(
  'user will see sidebar in topology page with title {string} on clicking the connection',
  (triggerName: string) => {
    cy.get(topologyPO.graph.triggerLink).click();
    topologySidePane.verify();
    topologySidePane.verifyTitle(triggerName);
  },
);
