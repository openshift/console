Feature: Create event sources
    As a developer I want to create event sources for ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding. 

Background:
   Given open shift cluster is installed with Serverless and eventing operator
   And open project namespace "aut-create-knative-event-source"
   And user is at Developer Perspective


@regression, @smoke
Scenario: Different event source types display in event sources add page - Kn-07-TC03, Kn-08-TC02
   Given user is at Add page 
   When user clicks on "Event Sources" card
   Then user redirects to page with header name "Event Sources"
   And able to see event source types like ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding


@regression, @smoke
Scenario: CamelSource event source - Kn-08-TC03
   Given cluster is installed with knative Apache camel operator 
   When user clicks on "Event Sources" card
   Then user redirects to page with header name "Event Sources"
   And user able to see "CamelSource" event source type


Scenario: knative eventing in operator backed - Kn-07-TC04
   Given user is at Add page 
   When user clicks on "Operator Backed" card
   Then user redirects to page with header name "Developer Catalog"
   And able to see Knative Eventing card


Scenario: Notifier message display in Event sources page when knative service is not available in namespace - Kn-10-TC01
   Given user is at Add page 
   But knative service is not available for selected namespace
   When user clicks on "Event Sources" card
   Then user redirects to page with header name "Event Sources"
   And able to see notifier with header "Event Sources Cannot be Created"
   And message as "Event Sources can only sink to Knative Services. No Knative Services exist in this project."


Scenario: Event source details for ApiServerSource event source type - Kn-10-TC02
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "Api Server Source"
   Then page contains Resource, Mode, Service Account Name, Sink, General sections
   And Resoruce contains App Version, Kind fields
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields have defautl text as "api-server-source-app", "api-server-source"
   And Create button is disabled


Scenario: Event source details for ContainerSource event source type - Kn-10-TC03
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "Container Source"
   Then page contains Container, Environmental variables, Sink, General sections
   And Container has Image, Name, Arguments text fields and Add args link
   And Environmental variables has Name, Value fields and Add More link
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "container-source-app", "container-source"
   And Create button is disabled


Scenario: Event source details for CronJobSource event source type - Kn-10-TC04
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "Cron Job Source"
   Then page contains CronJobSource, Sink, General sections
   And CronJobSource has Data, Scedule fields 
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "cron-job-source-app", "cron-job-source"
   And Create button is disabled


Scenario: Event source details for PingSource event source type - Kn-10-TC05
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "PingSource"
   Then page contains PingSource, Sink, General sections
   And PingSource has Data, Scedule fields 
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "ping-source-app", "ping-source"
   And Create button is disabled


Scenario: Event source details for SinkBinding event source type - Kn-10-TC06
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "SinkBinding"
   Then page contains Subject, Sink, General sections
   And Subject has apiVersion, Kind, Match Labels with Name, Value fields and Add Values link
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "ping-source-app", "ping-source"
   And Create button is disabled


Scenario: Event source details for CamelSource event source type - Kn-10-TC07
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "CamelSource"
   Then page contains CamelSource section
   And Create button is enabled


@regression, @smoke
Scenario: Create ApiServerSource event source - Kn-10-TC08
   Given user is on Event Sources page
   When user selects event source type "Api Server Source"
   And type Resoruce APIVERSION as "sources.knative.dev/v1alpha1"
   And type Resource KIND as "ApiServerSource"
   And selects "default" option from Service Account Name field
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to Topology page
   And ApiServerSource event source is created and linked to selected kantive service


@regression
Scenario: Create ContainerSource event source - Kn-10-TC09
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "Container Source"
   And type Container Image as "openshift/hello-openshift"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to Topology page
   And ContainerSource event source is created and linked to selected kantive service


@regression
Scenario: Create CronJobSource event source - Kn-10-TC10
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "CronJobSource"
   And type schedule as "*/2 * * * *"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to Topology page
   And CronJobSource event source is created and linked to selected kantive service


@regression
Scenario: Create PingSource event source - Kn-10-TC11
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "PingSource"
   And type schedule as "*/2 * * * *"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to Topology page
   And PingSource event source is created and linked to selected kantive service


@regression
Scenario: Create SinkBinding event source - Kn-10-TC12
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "SinkBinding"
   And type Subject apiVersion as "batch/v1"
   And type Subject Kind as "job"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to Topology page
   And SinkBinding event source is created and linked to selected kantive service


@regression, @manual
Scenario: Create CamelSource event source - Kn-10-TC13, Kn-08-TC03
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects event source type "CamelSource"
   And user clicks on Create button
   Then user redirects to Topology page
   And CamelSource event source is created and linked to selected kantive service