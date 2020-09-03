Feature: Apache Camel eventing
    As a developer I want to create camel eventing sources

Background:
   Given open shift cluster is installed with apache camel source operator
   And user is at developer perspecitve
   And user has selected namespace "aut-knative-camel-event-source"


@regression, @smoke
Scenario: CamelSource display in event sources add page - Kn-07-TC03
   Given user is at Add page 
   When user clicks on "Event Sources" card
   Then user will be redirected to page with header name "Event Sources"
   And able to see CamelSource event type

