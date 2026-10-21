@knative-serverless @knative
Feature: Event sources cards display
              As a user, I want to create event sources

        Background:
            Given user has installed Red Hat Integration - Camel K Operator
              And user has created or selected namespace "aut-knative"


        @smoke @manual
        Scenario: Different event source display in event sources add page: KN-03-TC01
            Given user is at Add page
              And user has installed one or more operators that contribute event sources
             When user clicks on "Event Source" Card
             Then user will be redirected to "Event Sources" page
              And user will see the list of Providers
              And user will see the Event Sources cards
              And user will see Filter by Keyword field
              And user will see sort dropdown with values A-Z, Z-A
              And user is able to see event sources like ApiServerSource, ContainerSource, PingSource, SinkBinding


        @smoke
        Scenario: Event Source card display on serverless operator installation: KN-03-TC02
            Given user is at Add page
             Then user is able to see "Event Source" card on Add page
              And user is able to see "Operator Backed" card on Add page
              And user is able to see "Channel" card on Add page
              And user is able to see "Broker" card on Add page


        @regression
        Scenario: knative eventing in operator backed: KN-03-TC03
            Given user is at Add page
             When user clicks on "Operator Backed" Card
             Then user will be redirected to "Operator Backed" page
              And user can see knative Eventing card


  @smoke @broken-test
  #   Kamelet Source option does not exist on Even Sources page
        Scenario: Kamelets in event source: KN-03-TC04
            Given user is at developer perspective
              And user is at Add page
             When user clicks on "Event Source" Card
             Then user will be redirected to "Event Sources" page
              And user is able to see "Kamelet Source" type

        @regression
        Scenario: Notifier message display in Event sources page when knative service is not available in namespace: KN-03-TC05
            Given user is at Add page
             When user clicks on "Event Source" Card
              And user selects event source type "Api Server Source"
              And user selects Create Event Source
              And user selects Resource option in Target section
             Then user is able to see notifier header "No resources available"
              And user can see message in sink section as "Select the URI option, or exit this form and create a Knative Service, Broker, or Channel first."


        @smoke @manual
        Scenario: Different event source display in event sources add page: KN-03-TC06
            Given user is at Add page
              And user has installed one or more operators that contribute event sources
             When user clicks on "Event Source" Card
             Then user will be redirected to "Event Sources" page
              And user will see the list of Providers
              And user will see the Event Sources cards
              And user will see Filter by Keyword field
              And user will see sort dropdown with values A-Z, Z-A
              And user is able to see event sources like ApiServerSource, ContainerSource, PingSource, SinkBinding
