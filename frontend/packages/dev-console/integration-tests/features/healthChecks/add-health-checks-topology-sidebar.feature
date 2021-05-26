@healthChecks
Feature: Health Checks
              As a user, I should be able to perform Health Checks on workloads

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-monitoring-sidebar"
              And user is at the Topology page


        @smoke
        Scenario: Add Health Checks page: HC-02-TC01
            Given workload "parks-test-d" with resource type "Deployment" is present in topology page
             When user clicks on the workload "parks-test-d" to open the sidebar
              And user selects "Add Health Checks" from topology sidebar Actions dropdown
             Then user will be redirected Add Health Checks page

    
        @smoke
        Scenario: Add Health Checks to Deployments from Sidebar: HC-02-TC02
            Given workload "health-checks-d" with resource type "Deployment" is present in topology page
             When user clicks on the workload "health-checks-d" to open the sidebar
              And user selects "Add Health Checks" from topology sidebar Actions dropdown
              And user clicks on Add Readiness Probe of type <readinesss_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Liveness Probe of type <liveness_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Startup Probe of type <startup_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see Readiness Probe added on the Add Health Checks page

        Examples:
                  | readinesss_type   | liveness_type     | startup_type      |
                  | HTTP GET          | HTTP GET          | HTTP GET          |
                  | TCP Socket        | TCP Socket        | TCP Socket        |
                  | Container Command | Container Command | Container Command |


        @smoke
        Scenario: Add Health Checks to Deployment Configs from Actions dropdown Sidebar: HC-02-TC03
            Given workload "health-checks-dc" with resource type "Deployment Config" is present in topology page
             When user clicks on the workload "health-checks-dc" to open the sidebar
              And user selects "Add Health Checks" from topology sidebar Actions dropdown
              And user clicks on Add Readiness Probe of type <readinesss_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Liveness Probe of type <liveness_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Startup Probe of type <startup_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see Liveness Probe added on the Add Health Checks page

        Examples:
                  | readinesss_type   | liveness_type     | startup_type      |
                  | HTTP GET          | HTTP GET          | HTTP GET          |
                  | TCP Socket        | TCP Socket        | TCP Socket        |
                  | Container Command | Container Command | Container Command |


        @regression
        Scenario: Add Health Check to Deployments from Context Menu: HC-02-TC04
            Given workload "health-checks-d" with resource type "Deployment" is present in topology page
             When user right clicks on the workload "health-checks-d" to open the Context Menu
              And user selects "Add Health Checks" from Context Menu
              And user clicks on Add Readiness Probe of type <readinesss_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Liveness Probe of type <liveness_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Startup Probe of type <startup_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see Startup Probe added on the Add Health Checks page

        Examples:
                  | readinesss_type   | liveness_type     | startup_type      |
                  | HTTP GET          | HTTP GET          | HTTP GET          |
                  | TCP Socket        | TCP Socket        | TCP Socket        |
                  | Container Command | Container Command | Container Command |


        @regression
        Scenario: Edit Health Checks option for Knative Service through Context Menu: HC-02-TC04
            Given workload "health-checks-kn" with resource type "Knative Service" is present in topology page
             When user right clicks on the Service "health-checks-kn" to open the Context Menu
              And user selects "Edit Health Checks" from Context Menu
              And user sees Readiness Probe already added
              And user clicks on Add Liveness Probe of type <liveness_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see Startup Probe added on the Add Health Checks page

        Examples:
                  | liveness_type     |
                  | HTTP GET          |
                  | TCP Socket        |
                  | Container Command |


        @regression
        Scenario: Edit Health Checks option from Actions dropdown on Sidebar for Deployment Configs to delete a Health Check: HC-02-TC05
            Given workload "health-checks-dc" with resource type "Deployment Config" is present in topology page
             When user clicks on the workload "health-checks-dc" to open the sidebar
              And user selects "Edit Health Checks" from topology sidebar Actions dropdown
              And user removes Readiness Probe
              And user clicks on Save button
             Then user will be redirected to Topology page
              And user will see Readiness Probe removed on the Add Health Checks page


        @regression
        Scenario: Edit Health Checks option for Helm Chart through Context Menu: HC-02-TC06
            Given user is on the topology sidebar of the helm release "nodejs-ex"
             When user right clicks on the "node-js-ex" to open the Context Menu
              And user selects "Edit Health Checks" from Context Menu
             Then user sees Readiness Probe already added
              And user sees Liveness Probe already added
