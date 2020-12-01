Feature: Eventing page at Administrator perspective
    As a user, I should be able to access event sources, channels, brokers at Administrator perspective


    Background:
        Given user is at administrator perspective
        And user has installed OpenShift Serverless Operator
        And user has created namespace "aut-eventing-page"

    
    @regression
    Scenario: Create new Event Source
        Given user is at eventing page
        And user has created knative service "hello-openshift"
        When user clicks on Create button
        And user selects Event Source
        And user clicks on Ping Source
        And user enters "Message" in Data field
        And user enters "* * * * *" in Schedule field
        And user selects resource "hello-openshift"
        And user clicks on Create button
        Then user will be redirected to Project Details page
        And user will see ping-source created

    
    @regression
    Scenario: Create new Channel
        Given user is at eventing page
        When user clicks on Create button
        And user selects Channel
        And user selects Default channels
        And user clicks on Create button
        Then user will be redirected to Project Details page
        And user will see channel created

    
    @regression, @manual
    Scenario: Brokers tab
        Given user is at eventing page
        And user has created Broker "example" 
        Then user will see broker at Brokers tab
        And user will see Broker Details page after clicking on broker "example"

    
    @regression, @manual
    Scenario: Triggers tab
        Given user is at eventing page
        And user has created Broker "example"
        And user has created knative service "hello-openshift"
        And user has created trigger subscribing to knative service created above
        Then user will see trigger at Triggers tab

    
    @regression, @manual
    Scenario: Channels tab
        Given user is at eventing page
        And user has created channel "example"
        And user has created knative service "hello-openshift"
        Then user will see channel at Channels tab

    
    @regression, @manual
    Scenario: Subscriptions tab
        Given user is at eventing page
        And user has created channel "example"
        And user has created knative service "hello-openshift"
        And user has created subscription subscribing to knative service created above
        Then user will see subscription at Triggers tab
        And user will see Subscription Details page after clicking on subscription "example"

    
    @regression, @manual
    Scenario: Broker Details page
        Given user is at eventing page
        And user has created Broker "example"
        And user has created knative service "hello-openshift"
        And user has created trigger subscribing to knative service created above
        And user click on broker "example" in broker tab 
        Then user will shown with Broker Details page
        And user will see Details tab with Broker Details
        And user will see YAML generated for Broker under YAML tab
        And user will see Broker name and Subscriber name under Triggers tab


    @regression, @manual
    Scenario: Trigger Details page
        Given user is at eventing page
        And user has created Broker "example"
        And user has created knative service "hello-openshift"
        And user has created trigger subscribing to knative service created above
        And user is at Trigger Details page
        Then user will see Details tab with Trigger Details
        And user will see YAML generated for Trigger under YAML tab


    @regression, @manual
    Scenario: Channel Details page
        Given user is at eventing page
        And user has created channel "example"
        And user has created knative service "hello-openshift"
        And user has created subscription subscribing to knative service created above
        And user is at Channel Details page
        Then user will see Details tab with Channel Details
        And user will see YAML generated for Channel under YAML tab
        And user will see Channel name and Subscriber name under Subscriptions tab


    @regression, @manual
    Scenario: Subscription Details page
        Given user is at eventing page
        And user has created channel "example"
        And user has created knative service "hello-openshift"
        And user has created subscription subscribing to knative service created above
        And user is at Subscription Details page
        Then user will see Details tab with Subscription Details
        And user will see YAML generated for Subscription under YAML tab
