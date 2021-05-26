@knative, @odc-5399
Feature: Visualisation of serverless fuctions
              As a user, I should be able to differentiate between a plain Knative Service and a Serverless Function when looking at the Details page of the KSVC and the details tab of the side panel in Topology

        Background:
            Given user is at developer perspective
              And user has installed Serverless Operator
              And And user has created Knative Serving instance in knative-serving namespace
              And user has created or selected namespace "aut-serverless-function"


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


        @regression
        Scenario: Sidebar of serverless function: SF-01-TC03
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on "nodetest"
             Then user will see type as "Functions" mentioned in the Details tab of sidebar
              And user will see Labels as boson.dev/function=true and boson.dev/runtime=node


        @regression
        Scenario: Service details page of serverless function: SF-01-TC04
            Given user has created serverless function "nodetest"
              And user is at Topology chart page
             When user clicks on "nodetest"
              And user clicks on heading "nodetest" in the sidebar
             Then user will see type as "Functions" mentioned in the Details tab of Service details page of "nodetest"
              And user will see Labels as boson.dev/function=true and boson.dev/runtime=node in Details tab
