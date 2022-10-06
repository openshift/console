@topology @ODC6771
Feature: Update user in topology page if Quotas has been reached in a namespace
            If any resource reached resource quota limit, a warning alert will be displayed for the user in Topology page.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology"


        @regression
        Scenario: single resource reached quota: T-19-TC01
            Given user has created workload with resource type deployment
             When user creates resource quota 'resourcequota1' by entering 'testData/resource-quota/resource-quota.yaml' file data
              And user navigates to Topology page
              And user clicks on link to view resource quota details
             Then user is redirected to resource quota details page
        
        
        @regression
        Scenario: multiple resources reached quota: T-19-TC02
            Given user has created workload with resource type deployment
              And user has created two resource quotas using 'testData/resource-quota/resource-quota.yaml' file
             When user navigates to Topology page
              And user clicks on link to view resource quota details
             Then user is redirected to resource quota list page
        

        @regression
        Scenario: deployment node has yellow border around it and side-panel shows alert when resource quota is reached: T-19-TC03
            Given user is at Add page
              And user has created workload "ex-node-js1" with resource type "deployment"
              And user is at Topology page
             When user clicks on workload 'ex-node-js1'
              And user can see sidebar opens with Resources tab selected by default
             Then user is able to see resource quota alert
              And user is able to see yellow border around 'ex-node-js1' workload   

              