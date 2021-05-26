@knative-eventing
Feature: Create event sources
              As a user, I want to create event sources

        Background:
            Given user has created or selected namespace "aut-knative"
              And user has created knative service "kn-event"
              And user is at Event Sources page


        @regression
        Scenario: Event source details for ApiServerSource event source type: KE-02-TC01
             When user selects event source type "Api Server Source"
              And user selects Create Event Source
             Then page contains Resource, Mode, Service Account Name, Sink, General sections
              And Resource contains App Version, Kind fields
              And sink has knative service dropdown with default text "Select knative Service"
              And Application Name, Name fields have default text as "api-server-source-app", "api-server-source"
              And Create button is disabled


        @regression
        Scenario: Event source details for ContainerSource event source type: KE-02-TC02
             When user selects event source type "Container Source"
              And user selects Create Event Source
             Then page contains Container, Environmental variables, Sink, General sections
              And container has Image, Name, Arguments text fields and Add args link
              And environment variables has Name, Value fields and Add More link
              And sink has knative service dropdown with default text "Select knative Service"
              And Application Name, Name fields will have default text as "container-source-app", "container-source"
              And Create button is disabled


        @regression
        Scenario: Event source details for CronJobSource event source type: KE-02-TC03
             When user selects event source type "Cron Job Source"
              And user selects Create Event Source
             Then page contains CronJobSource, Sink, General sections
              And CronJobSource has Data, Schedule fields
              And sink has knative service dropdown with default text "Select knative Service"
              And Application Name, Name fields will have default text as "cron-job-source-app", "cron-job-source"
              And Create button is disabled


        @regression
        Scenario: Event source details for PingSource event source type: KE-02-TC04
             When user selects event source type "PingSource"
              And user selects Create Event Source
             Then page contains PingSource, Sink, General sections
              And PingSource has Data, Schedule fields
              And sink has knative service dropdown with default text "Select knative Service"
              And Application Name, Name fields will have default text as "ping-source-app", "ping-source"
              And Create button is disabled


        @regression
        Scenario: Event source details for SinkBinding event source type: KE-02-TC05
             When user selects event source type "SinkBinding"
              And user selects Create Event Source
             Then page contains Subject, Sink, General sections
              And Subject has apiVersion, Kind, Match Labels with Name, Value fields and Add Values link
              And sink has knative service dropdown with default text "Select knative Service"
              And Application Name, Name fields will have default text as "ping-source-app", "ping-source"
              And Create button is disabled


        @regression
        Scenario: Event source details for CamelSource event source type: KE-02-TC06
             When user selects event source type "CamelSource"
              And user selects Create Event Source
             Then page contains CamelSource section
              And Create button is enabled


        @smoke
        Scenario: Create ApiServerSource event source: KE-02-TC07
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
        Scenario: Create ContainerSource event source: KE-02-TC08
             When user selects event source type "Container Source"
              And user selects Create Event Source
              And user enters Container Image as "openshift/hello-openshift"
              And user selects an "kn-event" option from knative service field
              And user clicks on Create button
             Then user will be redirected to Topology page
              And ContainerSource event source "container-source" is created and linked to selected knative service "kn-event"


        @regression
        Scenario: Create CronJobSource event source: KE-02-TC09
             When user selects event source type "Cron Job Source"
              And user selects Create Event Source
              And user enters schedule as "*/2 * * * *"
              And user selects an "kn-event" option from knative service field
              And user clicks on Create button
             Then user will be redirected to Topology page
              And CronJobSource event source "cron-job-source" is created and linked to selected knative service "kn-event"


        @smoke
        Scenario: Create PingSource event source: KE-02-TC10
             When user selects event source type "Ping Source"
              And user selects Create Event Source
              And user enters schedule as "*/2 * * * *"
              And user selects an "kn-event" option from knative service field
              And user clicks on Create button
             Then user will be redirected to Topology page
              And PingSource event source "ping-source" is created and linked to selected knative service "kn-event"


        @smoke
        Scenario: Create SinkBinding event source linked with knative service: KE-02-TC11
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
        Scenario: Create SinkBinding event source linked with uri: KE-02-TC12
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
        Scenario: Create CamelSource event source: KE-02-TC13
            Given user has installed Knative Apache Camelk Integration Operator
              And user has created or selected namespace "aut-knative"
              And user has created knative service "kn-event"
              And user is at Event Sources page
             When user selects event source type "Camel Source"
              And user selects Create Event Source
              And user clicks on Create button
             Then user will be redirected to Topology page
              And CamelSource event source "camel-source" is created and linked to selected knative service "kn-event"


        @regression
        Scenario: Kamelets on Event Sources page: KE-02-TC14
            Given user has created Knative Serving and Knative Eventing CR
              And user has installed Red Hat Integration - Camel K Operator
              And user has created Integration Platform CR
              And user has created or selected "aut-test-kamelets" namespace
              And user is at Developer Catalog page
             When user clicks on Event Sources
             Then user will see cards of AWS Kinesis Source, AWS SQS Source, Jira Source, Salesforce Source, Slack Source, Telegram Source
