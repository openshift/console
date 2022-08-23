@topology @add-flow @ODC6771
Feature: Update user in topology and add flow if Quotas has been reached in a namespace
            If any resource reached resource quota limit, a warning alert will be displayed for the user in Add page and Topology page.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression
        Scenario: Deploy git workload with devfile from topology page: T-19-TC01
            Given user is at the Topology page
             When user right clicks on topology empty graph
              And user selects "Import from Git" option from Add to Project context menu
              And user enters Git Repo URL as "https://github.com/nodeshift-starters/devfile-sample" in Import from Git form
              And user enters workload name as "node-bulletin-board-1"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user is able to see workload "node-bulletin-board-1" in topology page


        @regression
        Scenario: user creates a resource quota: T-19-TC02
            Given user clicks on import YAML button
             When user creates resource quota 'resourcequota1' by entering "testData/resource-quota/resource-quota.yaml" file data
              And user clicks on Create button
             Then user is redirected to resource quota details page


        @regression
        Scenario: check resource quota reached warning message in topology page: T-19-TC03
            Given user is at the Topology page
             When user clicks on link to view resource quota details
             Then user is redirected to resource quota details page


        @regression
        Scenario: check resource quota reached warning message in Add page: T-19-TC04
            Given user is at the Add page
             When user clicks on link to view resource quota details
             Then user is redirected to resource quota details page


        @regression
        Scenario: user creates another resource quota: T-19-TC05
            Given user clicks on import YAML button
             When user creates resource quota 'resourcequota2' by entering "testData/resource-quota/resource-quota.yaml" file data
              And user clicks on Create button
             Then user is redirected to resource quota details page


        @regression
        Scenario: Click on warning message link to see the resource quotas list in toplology page: T-19-TC06
            Given user is at the Topology page
             When user clicks on link to view resource quota details
             Then user is redirected to resource quota list page


        @regression
        Scenario: Click on warning message link to see the resource quotas list in Add page: T-19-TC07
            Given user is at the Add page
             When user clicks on link to view resource quota details
              And user is redirected to resource quota list page
              And user deletes resource quotas created
             Then user should not be able to see the resource quotas "resourcequota1" and "resourcequota2"


        @regression
        Scenario: Delete the application created: A-04-TC01: T-19-TC08
            Given user is at the Topology page
             When user right clicks on Application Grouping "devfile-sample-app"
              And user clicks on Delete application
              And user enters the name "devfile-sample-app" in the Delete application modal and clicks on Delete button        

