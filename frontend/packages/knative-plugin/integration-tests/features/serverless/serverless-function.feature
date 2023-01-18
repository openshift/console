@knative-serverless
Feature: Creation and Visualisation of serverless fuctions
              As a user, I want to create and verify a serverless function from Add Options and I should be able to differentiate between a plain Knative Service and a Serverless Function when looking at the Details page of the KSVC and the details tab of the side panel in Topology.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-serverless-function"


        @regression @odc-7167
        Scenario Outline: Create Serverless Function from Import From Git Form on Add page: SF-01-TC05
            Given user is at Add page
              And user is at Import from Git form
             When user enters Git Repo URL as "<git_url>"
              And user enters Name as "<workload_name>"
              And user clicks Create button on Add page
             Then user will be redirected to Topology page
              And user clicks on Topology list view
              And user will see name of the serverless function as KSVC label followed by fx label and name "<workload_name>"

        Examples:
                  | git_url                                             | workload_name        |
                  | https://github.com/Lucifergene/serverless-func-repo | serverless-func-repo |


        @regression @manual
        Scenario: Visualize serverless function in topology chart view: SF-01-TC01
            Given user has created serverless function "nodetest"
              And user is at Topology list page
             When user clicks on Topology chart view
             Then user will see name of the serverless function as fx label followed by KSVC label and name "nodetest"
              And user will not see git and build decorator associated with the function


        @regression @manual
        Scenario: Visualize serverless function in topology list view: SF-01-TC02
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on Topology list view
             Then user will see name of the serverless function as KSVC label followed by fx label and name "nodetest"


        @regression @to-do
        Scenario: Sidebar of serverless function: SF-01-TC03
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on "nodetest"
             Then user will see type as "Functions" mentioned in the Details tab of sidebar
              And user will see Labels as boson.dev/function=true and boson.dev/runtime=node


        @regression @to-do
        Scenario: Service details page of serverless function: SF-01-TC04
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on "nodetest"
              And user clicks on heading "nodetest" in the sidebar
             Then user will see type as "Functions" mentioned in the Details tab of Service details page of "nodetest"
              And user will see Labels as boson.dev/function=true and boson.dev/runtime=node in Details tab
