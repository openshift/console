@knative-eventing @knative
Feature: Create event sources
              As a user, I want to create event sources

        Background:
            Given user has created or selected namespace "aut-knative"
              And user has created knative service "kn-event"
              And user is at Event Sources page


        @smoke
        Scenario: Event Sources on default Software Catalog: KE-02-TC01
             Then user will see the cards of Event Sources
              And user will see Filter by Keyword field
              And user will see A-Z, Z-A sort by dropdown


        @regression @odc-6359
        Scenario: Event source details for ApiServerSource event source type: KE-02-TC02
             When user selects event source type "Api Server Source"
              And user selects Create Event Source
             Then page contains Resource, Mode, Service Account name, Sink
              And Resource contains App Version, Kind fields
              And sink has knative service dropdown with "Service" and "KSVC" options
              And Create button is disabled


        @regression @odc-6359
        Scenario: Event source details for ContainerSource event source type: KE-02-TC03
             When user selects event source type "Container Source"
              And user selects Create Event Source
             Then page contains Container, Environment variables, Sink, Application and node name
              And container has Image, Name, Arguments text fields and Add args link
              And environment variables has Name, Value fields and Add More link
              And sink has knative service dropdown with "Service" and "KSVC" options
              And Create button is disabled


        @regression @odc-6359
        Scenario: Event source details for PingSource event source type: KE-02-TC04
             When user selects event source type "PingSource"
              And user selects Create Event Source
             Then page contains Data, Schedule, Sink, Application and node name
              And sink has knative service dropdown with "Service" and "KSVC" options
              And Create button is disabled


        @regression @odc-6359
        Scenario: Event source details for SinkBinding event source type: KE-02-TC05
             When user selects event source type "SinkBinding"
              And user selects Create Event Source
             Then page contains Subject, Sink
              And Subject has apiVersion, Kind, Match Labels with Name, Value fields and Add Values link
              And sink has knative service dropdown with "Service" and "KSVC" options
              And Create button is disabled

        @smoke
        Scenario: Create ApiServerSource event source: KE-02-TC06
             When user selects event source type "Api Server Source"
              And user selects Create Event Source
              And user enters Resource APIVERSION as "sources.knative.dev/v1alpha1"
              And user enters Resource KIND as "ApiServerSource"
              And user selects "Resource" mode
              And user selects "default" option from Service Account Name field
              And user selects an "kn-event" option from knative service field
              And user enters event source name as "api-service-1"
              And user clicks on Create button
             Then user will be redirected to Topology page
              And ApiServerSource event source "api-service-1" is created and linked to selected knative service "kn-event"


        @smoke
        Scenario: Create ContainerSource event source: KE-02-TC07
             When user selects event source type "Container Source"
              And user selects Create Event Source
              And user enters Container Image as "quay.io/openshift-knative/showcase"
              And user selects an "kn-event" option from knative service field
              And user clicks on Create button
             Then user will be redirected to Topology page
              And ContainerSource event source "container-source" is created and linked to selected knative service "kn-event"


        @smoke
        Scenario: Create PingSource event source: KE-02-TC08
             When user selects event source type "Ping Source"
              And user selects Create Event Source
              And user enters schedule as "*/2 * * * *"
              And user selects an "kn-event" option from knative service field
              And user clicks on Create button
             Then user will be redirected to Topology page
              And PingSource event source "ping-source" is created and linked to selected knative service "kn-event"


        @smoke
        Scenario: Create SinkBinding event source linked with knative service: KE-02-TC09
             When user selects event source type "Sink Binding"
              And user selects Create Event Source
              And user enters Subject apiVersion as "batch/v1"
              And user enters Subject Kind as "job"
              And user selects an "kn-event" option from knative service field
              And user enters Name as "event-sink" in General section
              And user clicks on Create button
             Then user will be redirected to Topology page
              And SinkBinding event source "event-sink" is created and linked to selected knative service "kn-event"


        @smoke
        Scenario: Create SinkBinding event source linked with uri: KE-02-TC10
             When user selects event source type "Sink Binding"
              And user selects Create Event Source
              And user enters Subject apiVersion as "batch/v1"
              And user enters Subject Kind as "job"
              And user selects "URI" option under Sink section
              And user enters uri as "http://cluster.example.com/svc"
              And user enters Name as "event-uri" in General section
              And user clicks on Create button
             Then user will be redirected to Topology page
              And user will see that event source "event-uri" is sinked with uri "http://cluster.example.com/svc"


        @regression @manual
        Scenario: Create CamelSource event source: KE-02-TC11
            Given user has installed Red Hat Integration - Camel K Operator
              And user has created or selected namespace "aut-knative"
              And user has created knative service "kn-event"
              And user is at Event Sources page
             When user selects event source type "Camel Source"
              And user selects Create Event Source
              And user clicks on Create button
             Then user will be redirected to Topology page
              And CamelSource event source "camel-source" is created and linked to selected knative service "kn-event"


        @regression
        Scenario: Kamelets on Event Sources page: KE-02-TC12
            Given user has created Knative Serving and Knative Eventing CR
              And user has installed Red Hat Integration - Camel K Operator
              And user has created Integration Platform CR "camel-ipcr"
              And user has created or selected namespace "aut-test-kamelets"
              And user is at developer perspective
              And user is at Add page
             When user clicks on Event Sources
             Then user will see cards of "AWS Kinesis Source","AWS SQS Source","Jira Source","Salesforce Source","Slack Source","Telegram Source"
