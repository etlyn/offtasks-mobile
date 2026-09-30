@e2e @mobile @sync @widget @persistence
# Feature code: 10
Feature: Mobile sync, persistence, and widget updates
    Mobile task data and preferences should persist locally, sync with Supabase, and publish iOS widget snapshots when available.

    Background:
        Given the tester is signed in to the mobile app with a reusable test account

    # Scenario code: 10.1
    Scenario: Persist drawer preferences after app restart
        When the tester toggles Appearance, Hide Completed Tasks, Advanced Mode, and Auto-move due tasks
        And the tester fully restarts the app
        Then the drawer should restore the same preference values
        And the overview should reflect the restored preferences

    # Scenario code: 10.2
    Scenario: Sync preferences back from Supabase
        Given the tester changes web preferences with the same account
        When the tester launches the mobile app and waits for preference hydration
        Then mobile should match the synced theme, advanced mode, hide completed, and auto-move settings

    # Scenario code: 10.3
    Scenario: Refresh tasks when returning from the background
        Given the tester sends the mobile app to the background
        And a task is changed from another client using the same account
        When the tester returns the app to the foreground
        Then the task lists should refresh and show the remote change

    # Scenario code: 10.4
    Scenario: Auto-move due Tomorrow tasks after refresh
        Given Auto-move due tasks is enabled
        And a Tomorrow task has a scheduled date of today or earlier
        When the tester refreshes or reopens the app
        Then the task should move into Today
        And the update should sync through Supabase

    # Scenario code: 10.5
    Scenario: Publish an iOS widget task snapshot
        Given the tester is running an iOS build with the widget bridge available
        When tasks or theme mode change in the authenticated app
        Then the widget snapshot should include generated time, theme, today totals, and pending Today, Tomorrow, and Later tasks
        And completed tasks should not be listed as pending widget items

    # Scenario code: 10.6
    Scenario: Clear or refresh widget state after sign out
        Given the tester is signed in on an iOS build with the widget bridge available
        When the tester signs out
        Then the app should stop publishing signed-in task data for the previous account
        And the next signed-in account should publish its own task snapshot after refresh