@knative
Feature: Create event sources
              As a user, I want to create event sources

        Background:
            Given user has installed knative Apache camel operator
              And user has created or selected namespace "aut-namespace"
              And user is at developer perspective


        @smoke @manual
        Scenario: Different event source display in event sources add page : Kn-07-TC03, Kn-08-TC02
            Given user is at Add page
              And user has installed one or more operators that contribute event sources
             When user clicks on "Event Source" card
             Then user will be redirected to "Event Sources" page
              And user will see the list of Providers
              And user will see the Event Sources cards
              And user will see Filter by Keyword field
              And user will see sort dropdown with values A-Z, Z-A
              And user is able to see event sources like ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding


        @smoke
        Scenario: Event Source card display on serverless operator installation : A-03-TC02
            Given user is at Add page
             Then user is able to see "Event Source" card on Add page
              And user is able to see "Operator Backed" card on Add page


        @smoke
        Scenario: CamelSource event source : Kn-08-TC03
            Given user is at Add page
             When user clicks on "Event Source" card
             Then user will be redirected to "Event Sources" page
              And user is able to see "Camel Source" event source type


        @regression
        Scenario: knative eventing in operator backed : Kn-07-TC04
            Given user is at Add page
             When user clicks on "Operator Backed" card
             Then user will be redirected to "Developer Catalog" page
              And user is able to see knative Eventing card


        @smoke
        Scenario: CamelSource event source : Kn-08-TC03
            Given user has installed knative Apache camel operator
              And user is at developer perspective
              And user is at Add page
             When user clicks on "Event Source" card
             Then user will be redirected to "Event Sources" page
              And user is able to see "Camel Source" event source type


        @regression
        Scenario: knative eventing in operator backed : Kn-07-TC04
            Given user is at Add page
             When user clicks on "Operator Backed" card
             Then user will be redirected to "Developer Catalog" page
              And user is able to see knative Eventing card


        @regression
        Scenario: Operator Backed card display on serverless operator installation : A-02-TC01
              And user is at namespace "aut-namespace"
             When user selects Add option from left side navigation menu
             Then user will be redirected to Add page
              And user is able to see "Operator Backed" card on Add page


        @regression
        Scenario: Notifier message display in Event sources page when knative service is not available in namespace : Kn-10-TC01
            Given user is at Add page
             When user clicks on "Event Source" card
              And user selects event source type "Api Server Source"
              And user selects Resource option in Sink section
             Then user is able to see notifier header "No resources available"
              And user can see message in sink section as "Event Sources can only sink to knative Services. No knative Services exist in this project."


        @smoke @manual
        Scenario: Different event source display in event sources add page : Kn-07-TC03, Kn-08-TC02
            Given user is at Add page
              And user has installed one or more operators that contribute event sources
             When user clicks on "Event Source" card
             Then user will be redirected to "Event Sources" page
              And user will see the list of Providers
              And user will see the Event Sources cards
              And user will see Filter by Keyword field
              And user will see sort dropdown with values A-Z, Z-A
              And user is able to see event sources like ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding
