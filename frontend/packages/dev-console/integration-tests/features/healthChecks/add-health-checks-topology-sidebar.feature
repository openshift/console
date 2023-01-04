@health-checks
Feature: Perform Health Checks related Actions
              As a user, I should be able to perform Health Checks on workloads

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-monitoring-sidebar"
              And user is at the Topology page


        @smoke
        Scenario: Add Health Checks page: HC-02-TC01
            Given workload "health-checks-d" with resource type "Deployment" is present in topology page
             When user clicks on the workload "health-checks-d" to open the sidebar
              And user selects "Add Health Checks" from topology sidebar Actions dropdown
             Then user will be redirected Add Health Checks page


        @smoke
        Scenario Outline: Add Health Checks to Deployments from Sidebar: HC-02-TC02
            Given workload "<workload_name>" with resource type "Deployment" is present in topology page
             When user searches and clicks on the workload "<workload_name>" to open the sidebar
              And user selects "Add Health Checks" from topology sidebar Actions dropdown
              And user clicks on Add Readiness Probe
              And user selects type as "<readinesss_type>"
              And user clicks on tick button
              And user clicks on Add Liveness Probe
              And user selects type as "<liveness_type>"
              And user clicks on tick button
              And user clicks on Add Startup Probe
              And user selects type as "<startup_type>"
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see all 3 Probes added on the Add Health Checks page for "Deployment" "<workload_name>"
              And user can see workload "<workload_name>" in topology page

        Examples:
                  | workload_name | readinesss_type   | liveness_type     | startup_type      |
                  | http-d        | HTTP GET          | HTTP GET          | HTTP GET          |
                  | tcp-d         | TCP socket        | TCP socket        | TCP socket        |
                  | command-d     | Container command | Container command | Container command |


        @smoke
        Scenario Outline: Add Health Checks to Deployment Configs from Actions dropdown Sidebar: HC-02-TC03
            Given workload "<workload_name>" with resource type "Deployment Config" is present in topology page
             When user searches and clicks on the workload "<workload_name>" to open the sidebar
              And user selects "Add Health Checks" from topology sidebar Actions dropdown
              And user clicks on Add Readiness Probe
              And user selects type as "<readinesss_type>"
              And user clicks on tick button
              And user clicks on Add Liveness Probe
              And user selects type as "<liveness_type>"
              And user clicks on tick button
              And user clicks on Add Startup Probe
              And user selects type as "<startup_type>"
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see all 3 Probes added on the Add Health Checks page for "DeploymentConfig" "<workload_name>"
              And user can see workload "<workload_name>" in topology page

        Examples:
                  | workload_name | readinesss_type   | liveness_type     | startup_type      |
                  | http-dc       | HTTP GET          | HTTP GET          | HTTP GET          |
                  | tcp-dc        | TCP socket        | TCP socket        | TCP socket        |
                  | command-dc    | Container command | Container command | Container command |



        @regression
        Scenario: Add Health Check to Deployments from Context Menu: HC-02-TC04
            Given workload "health-checks-d" with resource type "Deployment" is present in topology page
             When user right clicks on the workload "health-checks-d" to open the Context Menu
              And user selects "Add Health Checks" from Context Menu
              And user clicks on Add Readiness Probe
              And user selects type as "HTTP GET"
              And user clicks on tick button
              And user clicks on Add button
             Then user will be redirected to Topology page
              And user will see "Readiness probe" added on the Add Health Checks page for "Deployment" "health-checks-d"
              And user can see workload "health-checks-d" in topology page


        @regression
        Scenario: Edit Health Checks option from Actions dropdown on Sidebar for Deployment Configs to delete a Health Check: HC-02-TC05
            Given workload "health-checks-d" with resource type "Deployment Config" is present in topology page
             When user searches and clicks on the workload "health-checks-d" to open the sidebar
              And user selects "Edit Health Checks" from topology sidebar Actions dropdown
              And user removes Readiness Probe
              And user clicks on Save button
             Then user will be redirected to Topology page


        @regression
        Scenario: Edit Health Checks option for Helm Chart through Context Menu: HC-02-TC06
            Given user is at Add page
              And user is on the topology sidebar of the helm release "nodejs-ex"
             When user right clicks on the workload "nodejs-ex" to open the Context Menu
              And user selects "Edit Health Checks" from Context Menu
             Then user sees Readiness Probe already added
              And user sees Liveness Probe already added
