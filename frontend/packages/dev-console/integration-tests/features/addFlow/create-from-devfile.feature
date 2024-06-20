@add-flow @dev-console
Feature: Create Application from Devfile
              As a user, I want to deploy an application from git repo with devfile


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-devfile"
              And user is at Add page


        @regression
        Scenario: Deploy git workload with devfile from topology page: A-04-TC01
            Given user is at the Topology page
             When user right clicks on topology empty graph
              And user selects "Import from Git" option from Add to Project context menu
              And user enters Git Repo URL as "https://github.com/nodeshift-starters/devfile-sample" in Import from Git form
              And user enters workload name as "node-bulletin-board-1"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "node-bulletin-board-1" in topology page


        @regression
        Scenario: Create the workload from dev file: A-04-TC02
            Given user is at Import from Git form
             When user enters Git Repo URL as "https://github.com/nodeshift-starters/devfile-sample"
              And user enters workload name as "node-example"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "node-example" in topology page
              And user will see sidebar in topology page with title "node-example"


        @regression @broken-test
        Scenario: No service is shown in the node sidebar if it is not defined in the devfile : A-04-TC03
            Given user has created workload "node-example" with resource type "Deployment"
              And user is at Topology page
             When user clicks on workload "node-example"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see under Services section "No Services found for this resource."


        @regression @broken-test
        Scenario: No route is shown in the node sidebar if it is not defined in the devfile : A-04-TC04
            Given user has created workload "node-example" with resource type "Deployment"
              And user is at Topology page
             When user clicks on workload "node-example"
             Then user can see sidebar opens with Resources tab selected by default
              And user can see under Routes section "No Routes found for this resource."




        # Below scenario to be removed after the tests are are updated
        # @smoke
        # Scenario: Create the sample workload from dev file: A-04-TC03
        #     Given user is at Import from Git page
        #      When user selects Try sample link
        #       And user clicks Create button on Devfile page
        #      Then user will be redirected to Topology page
        #       And user is able to see workload "devfile-sample" in topology page


        @regression @to-do
        Scenario: Create the Devfiles workload from Developer Catalog: A-04-TC05
            Given user is at Developer Catalog page
             When user clicks on Devfiles type
              And user clicks on Basic Python card
              And user clicks on Create Application on the side drawer
              And user enters Application name as "devfile-sample-python-basic-git-app" in DevFile page
              And user enters Name as "devfile-sample-python-basic-git1"
              And user clicks on Create
             Then user is able to see workload "devfile-sample-python-basic-git1" in topology page
