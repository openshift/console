Feature: Route form view
              As a user, I need the ability to create and edit routes in dev perspective.


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-routes"
              And user has created workload "nodejs-ex-git1" with resource type "deployment"


        @smoke
        Scenario: Create route using form view: R-01-TC01
            Given user is at Routes page
             When user clicks on Create Route
              And user enters name of route as "test-route"
              And user enters Hostname of route as "example.com"
              And user selects service as "nodejs-ex-git1"
              And user selects target port as "8080 → 8080 (TCP)"
              And user clicks on Create button
             Then user sees routes details page of "test-route"


        @regression
        Scenario: Edit config-maps using form view: R-01-TC02
            Given user has created route named "test-route1" with service "nodejs-ex-git1" at target port "8080 → 8080 (TCP)"
              And user is at Routes page
             When user clicks on kebab menu of Route "test-route1"
              And user clicks on Edit Route
              And user changes Hostname to "test.com"
              And user clicks on Save button
             Then user sees routes details page of "test-route1"
              And user sees Host as "test.com"
