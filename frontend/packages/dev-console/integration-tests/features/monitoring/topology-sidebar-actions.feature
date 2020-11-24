@monitoring
Feature: Monitoring tab on the topology Sidebar and Health Checks
        As a user, I should be able to see Monitoring tab on the sidebar of topology page and add Health Checks

    Background:
        Given user is at developer perspective
        And user has selected exisitng namespace or created namespace "aut-monitoring-sidebar"


    @smoke
    Scenario Outline: Navigating to Monitoring page from topology page Sidebar for "<resourceType>" workload : "<tcNo>"
        Given workload "<workload>" with resource type "<resourceType>" is present in topology page
        When user clicks on the workload "<workload>" to open the sidebar
        And user clicks on Monitoring tab
        And user clicks on View Monitoring dashboard link
        Then page redirected to the Monitoring page
        And user will see CPU Usage Metrics
        And user will see Memory Usage Metrics
        And user will see Receive Bandwidth Metrics
        And user will see All Events dropdown

        Examples:
            | workload      | resourceType      | tcNo                   |
            | parks-test-d  | Deployment        | MH-02-TC02, MH-03-TC01 |
            | parks-test-dc | Deployment Config | MH-02-TC03             |


    @smoke
    Scenario: Monitoring tab on the Sidebar for Helm Release: MH-02-TC04
        Given helm release "nodejs-ex-k" is present in topology page
        When user clicks on the workload "node-js-ex" to open the sidebar
        And user clicks on Monitoring tab
        And user clicks on View Monitoring dashboard link
        Then page redirected to the Monitoring page


    @regression
    Scenario: Monitoring tab on the Sidebar for Knative Service: MH-02-TC05
        Given workload "parks-test-kn" with resource type "Knative Service" is present in topology page
        And user is at the Topology page
        When user clicks on the knative service "nodejs-ex-git-app" to open the sidebar
        Then user wont see Monitoring tab


# This is already covered as part of A-04-TC12
    @healthChecks, @smoke
    Scenario: Health Checks option in Advanced Options: MH-04-TC01
        Given user is at Add page
        When user clicks on From Git card
        Then user will see Health Checks advanced option


# Git URL: https://github.com/openshift-roadshow/nationalparks-py
# This is already covered as part of A-04-TC12
    @healthChecks, @smoke
    Scenario: Health Checks option in Advanced Options: MH-04-TC02
        Given user is at Add page
        When user clicks on From Git card
        And user enters Git Repo url as "https://github.com/openshift-roadshow/nationalparks-py"
        And user enters Application name as "national-parks-demo"
        And user selects resource type as "Deployment"
        And user clicks "Health Checks" link in Advanced Options section
        And user clicks on Add Readiness Probe
        And user clicks on tick button
        And user clicks on Add Liveness Probe
        And user clicks on tick button
        And user clicks on Add Startup Probe
        And user clicks on tick button
        And user clicks Create button on Add page
        Then user will be redirected to Topology page
        And user will not see Add Health Checks link on the Sidebar for "national-parks-demo"
        And user will see Readiness Probe added on the Add Health Checks page


    @healthChecks, @smoke
    Scenario: Add Health Checks page: MH-05-TC01
        Given workload "parks-test-d" with resource type "Deployment" is present in topology page
        When user clicks on the workload "parks-test-d" to open the sidebar
        And user selects "Add Health Checks" from topology sidebar Actions dropdown
        Then user will be redirected Add Health Checks page


    @healthChecks, @smoke
    Scenario: Add Readiness Probe Health Check to Deployments from Sidebar: MH-05-TC02
        Given workload "health-checks-d" with resource type "Deployment" is present in topology page
        When user clicks on the workload "health-checks-d" to open the sidebar
        And user selects "Add Health Checks" from topology sidebar Actions dropdown
        And user clicks on Add Readiness Probe
        And user clicks on tick button
        And user clicks on Add button
        Then user will be redirected to Topology page
        And user will see Readiness Probe added on the Add Health Checks page


    @healthChecks, @smoke
    Scenario: Add Liveness Probe Health Check to Deployment Configs from Actions dropdown Sidebar: MH-05-TC02
        Given workload "health-checks-dc" with resource type "Deployment Config" is present in topology page
        When user clicks on the workload "health-checks-dc" to open the sidebar
        And user selects "Add Health Checks" from topology sidebar Actions dropdown
        And user clicks on Add Liveness Probe
        And user clicks on tick button
        And user clicks on Add button
        Then user will be redirected to Topology page
        And user will see Liveness Probe added on the Add Health Checks page


    @healthChecks, @regression
    Scenario: Add Startup Probe Health Check to Deployments from Context Menu: MH-05-TC02
        Given workload "health-checks-d" with resource type "Deployment" is present in topology page
        When user right clicks on the workload "health-checks-dc" to open the Context Menu
        And user selects "Add Health Checks" from Context Menu
        And user clicks on Add Startup Probe
        And user clicks on tick button
        And user clicks on Add button
        Then user will be redirected to Topology page
        And user will see Startup Probe added on the Add Health Checks page


    @healthChecks, @regression
    Scenario: Edit Health Checks option for Knative Service through Context Menu: MH-05-TC02
        Given workload "health-checks-kn" with resource type "Knative Service" is present in topology page
        When user right clicks on the Service "health-checks-kn" to open the Context Menu
        And user selects "Edit Health Checks" from Context Menu
        And user sees Readiness Probe already added
        And user clicks on Add Liveness Probe
        And user clicks on tick button
        And user clicks on Add button
        Then user will be redirected to Topology page
        And user will see Startup Probe added on the Add Health Checks page


    @healthChecks, @regression
    Scenario: Edit Health Checks option from Actions dropdown on Sidebar for Deployment Configs to delete a Health Check: MH-05-TC02
        Given workload "health-checks-dc" with resource type "Deployment Config" is present in topology page
        When user clicks on the workload "health-checks-dc" to open the sidebar
        And user selects "Edit Health Checks" from topology sidebar Actions dropdown
        And user removes Readiness Probe
        And user clicks on Save button
        Then user will be redirected to Topology page
        And user will see Readiness Probe removed on the Add Health Checks page


    @healthChecks, @regression
    Scenario: Edit Health Checks option for Helm Chart through Context Menu: MH-06-TC04
        Given user is on the topology sidebar of the helm release "nodejs-ex"
        When user right clicks on the "node-js-ex" to open the Context Menu
        And user selects "Edit Health Checks" from Context Menu
        Then user sees Readiness Probe already added
        And user sees Liveness Probe already added
