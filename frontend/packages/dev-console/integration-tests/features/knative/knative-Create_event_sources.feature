Feature: Create event sources
    As a developer I want to create event sources for ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding. 

Background:
   Given open shift cluster is installed with Serverless and eventing operator
   And open the project namespace "aut-create-knative-event-source"
   And user is on dev perspective


@regression, @smoke
Scenario: Different event source types display in event sources add page - Kn-07-TC03
   Given user is on Add page 
   When user clicks on "Event Sources" card
   Then user redirects to page with header name "Event Sources"
   And able to see event source types like ApiServerSource, ContainerSource, CronJobSource, PingSource, SinkBinding


Scenario: knative eventing in operator backed - Kn-07-TC04
   Given user is on Add page 
   When user clicks on "Operator Backed" card
   Then user redirects to page with header name "Developer Catalog"
   And able to see Knative Eventing card


Scenario: Notifier message display in Event sources page when knative service is not available in namespace - Kn-10-TC01
   Given user is on Add page
   But knative service is not available for selected namespace
   When user clicks on "Event Sources" card
   Then user redirects to page with header name "Event Sources"
   And able to see notifier with header "Event Sources Cannot be Created"
   And message as "Event Sources can only sink to Knative Services. No Knative Services exist in this project."


Scenario: Event source details for ApiServerSource event source type - Kn-10-TC02
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "ApiServerSource" type
   Then page contains Resource, Mode, Service Account Name, Sink, General sections
   And Resoruce contains App Version, Kind fields
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields have defautl text as "api-server-source-app", "api-server-source"
   And Create button is disabled


Scenario: Event source details for ContainerSource event source type - Kn-10-TC03
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "ContainerSource" type
   Then page contains Container, Environmental variables, Sink, General sections
   And Container has Image, Name, Arguments text fields and Add args link
   And Environmental variables has Name, Value fields and Add More link
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "container-source-app", "container-source"
   And Create button is disabled


Scenario: Event source details for CronJobSource event source type - Kn-10-TC04
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "CronJobSource" type
   Then page contains CronJobSource, Sink, General sections
   And CronJobSource has Data, Scedule fields 
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "cron-job-source-app", "cron-job-source"
   And Create button is disabled


Scenario: Event source details for PingSource event source type - Kn-10-TC05
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "PingSource" type
   Then page contains PingSource, Sink, General sections
   And PingSource has Data, Scedule fields 
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "ping-source-app", "ping-source"
   And Create button is disabled


Scenario: Event source details for SinkBinding event source type - Kn-10-TC06
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "SinkBinding" type
   Then page contains Subject, Sink, General sections
   And Subject has apiVersion, Kind, Match Labels with Name, Value fields and Add Values link
   And sink has Kantive service dropdown with defautl text "Select Kantive Service"
   And Application Name, Name fields will have defautl text as "ping-source-app", "ping-source"
   And Create button is disabled


Scenario: Event source details for CamelSource event source type - Kn-10-TC07
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "CamelSource" type
   Then page contains CamelSource section
   And Create button is enabled


@regression, @smoke
Scenario: Create ApiServerSource event source - Kn-10-TC08
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "ApiServerSource" type
   And type Resoruce APIVERSION as "sources.knative.dev/v1alpha1"
   And type Resource KIND as "ApiServerSource"
   And selects "default" option from Service Account Name field
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to the topology page
   And ApiServerSource event source is created and linked to selected kantive service


@regression
Scenario: Create ContainerSource event source - Kn-10-TC09
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "ContainerSource" type
   And type Container Image as "openshift/hello-openshift"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to the topology page
   And ContainerSource event source is created and linked to selected kantive service


@regression
Scenario: Create CronJobSource event source - Kn-10-TC10
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "CronJobSource" type
   And type schedule as "*/2 * * * *"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to the topology page
   And CronJobSource event source is created and linked to selected kantive service


@regression
Scenario: Create PingSource event source - Kn-10-TC11
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "PingSource" type
   And type schedule as "*/2 * * * *"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to the topology page
   And PingSource event source is created and linked to selected kantive service


@regression
Scenario: Create SinkBinding event source - Kn-10-TC12
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "SinkBinding" type
   And type Subject apiVersion as "batch/v1"
   And type Subject Kind as "job"
   And selects an option from Kantive service field
   And user clicks on Create button
   Then user redirects to the topology page
   And SinkBinding event source is created and linked to selected kantive service


@regression, @manual
Scenario: Create CamelSource event source - Kn-10-TC13
   Given user is on Event Sources page
   And knative service is available for selected namespace
   When user selects "CamelSource" type
   And user clicks on Create button
   Then user redirects to the topology page
   And CamelSource event source is created and linked to selected kantive service