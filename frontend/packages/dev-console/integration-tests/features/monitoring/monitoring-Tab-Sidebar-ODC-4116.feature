Feature: Monitoring tab on the Sidebar and Health Checks
    As a user, I should be able to see Monitoring tab on the sidebar and add Health Checks


Background: 
    Given user is at Developer perspective
    And user has a workload with name "national-parks-test"
    And user has helm release named "node-js-ex"
    And user has knative-service named "knative-demo"


@smoke, @regression
Scenario: Monitoring tab on the Sidebar for Deployments: MH-03-TC02
    Given user is at Topology page
    When user clicks on the workload "national-parks-test" to open the sidebar
    And user clicks on Monitoring tab
    And user clicks on View Monitoring dashborad link
    Then user will be taken to Dashboard tab on the Monitoring page


@regression
Scenario: Monitoring tab on the Sidebar for Helm Release: MH-03-TC02
    Given user is at Topology page
    When user clicks on the workload "node-js-ex" to open the sidebar
    And user clicks on Monitoring tab
    And user clicks on View Monitoring dashboard link
    Then user will be taken to Dashboard tab on the Monitoring page


@regression
Scenario: Monitoring tab on the Sidebar for Knative Service: MH-03-TC02
    Given user is at Topology page
    When user clicks on the knative service "knative-demo" to open the sidebar
    Then user wont see Monitoring tab


@smoke, @regression
Scenario: Opening Monitoring Dashboard link on the Sidebar for Deployments: MH-03-TC01
    Given user is at Topology page
    When user clicks on the workload "national-parks-test" to open the sidebar
    And user clicks on Monitoring tab
    Then user will see View Monitoring dashborad link
    And user will see CPU Usage Metrics
    And user will see Memory Usage Metrics
    And user will see Receive Bandwidth Metrics
    And user will see All Events dropdown


@smoke, @regression
Scenario: Health Checks option in Advanced Options: MH-04-TC01
    Given user is at +Add page
    When user clicks on From Git card
    Then user will see Health Checks advanced option


# Git URL: https://github.com/openshift-roadshow/nationalparks-py
@smoke, @regression
Scenario: Health Checks option in Advanced Options: MH-04-TC02
    Given user is at +Add page
    When user clicks on From Git card
    And user enters Git URL "https://github.com/openshift-roadshow/nationalparks-py"
    And user selects Python Builder Image
    And user enters name of the application as "national-parks-demo"
    And user selects Deployment as a resource type
    And user clicks on Health Checks advanced option
    And user clicks on Add Readiness Probe
    And user clicks on tick button
    And user clicks on Add Liveness Probe
    And user clicks on tick button
    And user clicks on Add Startup Probe
    And user clicks on tick button
    And user clicks on Create button
    Then user will be redirected to Topology page
    And user will not see Add Health Checks link on the Sidebar for "national-parks-demo"
    And user will see Readiness Probe added on the Add Health Checks page


@smoke, @regression
Scenario: Add Health Checks page: MH-05-TC01
    Given user is at Topology page
    And user has a new workload of Deployment type resource with name "national-parks-py-test"
    When user clicks on the workload "national-parks-py-test" to open the sidebar
    And user clicks on Add Health Checks
    Then user will be redirected Add Health Checks page


@smoke, @regression
Scenario: Add Readiness Probe Health Check to Deployments from Sidebar: MH-05-TC02
    Given user is at Topology page
    And user has a new workload of Deployment type resource with no Health Checks added with name "national-parks-py-test"
    When user clicks on the workload to open the sidebar
    And user clicks on Add Health Checks
    And user clicks on Add Readiness Probe
    And user clicks on tick button
    And user clicks on Add button
    Then user will be redirected to Topology page
    And user will see Readiness Probe added on the Add Health Checks page


@smoke, @regression
Scenario: Add Liveness Probe Health Check to Deployment Configs from Actions dropdown Sidebar: MH-05-TC02
    Given user is at Topology page
    And user has a new workload of Deployment Config type resource with no Health Checks added with name "test-deploy-1"
    When user clicks on the workload to open the sidebar
    And user clicks on Actions dropdown
    And user clicks on Add Health Checks
    And user clicks on Add Liveness Probe
    And user clicks on tick button
    And user clicks on Add button
    Then user will be redirected to Topology page
    And user will see Liveness Probe added on the Add Health Checks page


@smoke, @regression
Scenario: Add Startup Probe Health Check to Deployments from Context Menu: MH-05-TC02
    Given user is at Topology page
    And user has a new workload of Deployment type resource with no Health Checks added with name "test-deploy-2"
    When user right clicks on the workload to open the Context Menu 
    And user clicks on Add Health Checks
    And user clicks on Add Startup Probe
    And user clicks on tick button
    And user clicks on Add button
    Then user will be redirected to Topology page
    And user will see Startup Probe added on the Add Health Checks page


@smoke, @regression
Scenario: Edit Health Checks option for Knative Service through Context Menu: MH-05-TC02
    Given user is at Topology page
    And user has a workload of Knative Service type resource with name "knative-demo"
    When user right clicks on the Service to open the Context Menu
    And user clicks on Edit Health Checks
    And user sees Readiness Probe already added
    And user clicks on Add Liveness Probe
    And user clicks on tick button
    And user clicks on Add button
    Then user will be redirected to Topology page
    And user will see Startup Probe added on the Add Health Checks page


@smoke, @regression
Scenario: Edit Health Checks option from Actions dropdown on Sidebar for Deployment Configs to delete a Health Check: MH-05-TC02
    Given user is at Topology page
    And user has a workload of Deployment Config type resource with all Health Checks added  with name "national-parks"
    When user clicks on the workload to open the sidebar
    And user clicks on Actions dropdown
    And user clicks on Edit Health Checks
    And user clicks on minus sign in front of Readiness Probe Added text
    And user clicks on Save button
    Then user will be redirected to Topology page
    And user will see Readiness Probe removed on the Add Health Checks page


@smoke, @regression
Scenario: Edit Health Checks option for Helm Chart through Context Menu: MH-06-TC04
    Given user is at Topology page
    When user right clicks on the "node-js-ex" to open the Context Menu
    And user clicks on Edit Health Checks
    Then user sees Readiness Probe already added
    And user sees Liveness Probe already added
