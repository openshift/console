@crw
Feature: Opening Codeready Workspaces from Topology view for existing app
                As a developer user, I should be able to open Codeready Workspaces from Topology view
                with my app's code imported automatically.

            @smoke
            Scenario: "Open in CRW" decorator is present on the Node
                Given Codeready Workspaces instance is installed on the cluster
                And user has logged in as basic user
                And user is at Topology page
                And user has opened application "sdf" in topology page
                When user sees CRW decorator is present on the application
                And user click the CRW decorator on the application
                Then user will be redirected to CRW
                And new workspace will be started
                And source code will be automatically imported in the workspace
