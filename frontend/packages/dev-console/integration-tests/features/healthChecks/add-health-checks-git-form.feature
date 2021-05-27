@health-checks
Feature: Health Checks
              As a user, I should be able to perform Health Checks on workloads

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-monitoring-sidebar"
              And user is at Add page


    # Git URL: https://github.com/openshift-roadshow/nationalparks-py
    # This is already covered as part of A-04-TC12
        @smoke @to-do
        Scenario: Health Checks option in Advanced Options: HC-01-TC01
            Given user is at Import from Git page
             When user enters Git Repo url as "https://github.com/openshift-roadshow/nationalparks-py"
              And user enters Application name as "national-parks-demo"
              And user selects resource type as "Deployment"
              And user clicks "Health Checks" link in Advanced Options section
              And user clicks on Add Readiness Probe of type <readinesss_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Liveness Probe of type <liveness_type>
              And user fills the details
              And user clicks on tick button
              And user clicks on Add Startup Probe of type <startup_type>
              And user fills the details
              And user clicks on tick button
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user will not see Add Health Checks link on the Sidebar for "national-parks-demo"
              And user will see Readiness Probe added on the Add Health Checks page

        Examples:
                  | readinesss_type   | liveness_type     | startup_type      |
                  | HTTP GET          | HTTP GET          | HTTP GET          |
                  | TCP Socket        | TCP Socket        | TCP Socket        |
                  | Container Command | Container Command | Container Command |
