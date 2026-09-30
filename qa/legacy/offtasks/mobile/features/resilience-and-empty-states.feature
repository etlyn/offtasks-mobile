@e2e @mobile @resilience @empty-states
# Feature code: 11
Feature: Mobile resilience, loading, and empty states
    The mobile app should stay stable through loading, refresh, errors, and empty task lists.

    Background:
        Given the tester is using a simulator or device connected to the configured Supabase project

    # Scenario code: 11.1
    Scenario: Show splash and loading states before the authenticated shell
        Given the tester launches the mobile app
        When the splash animation finishes and auth state is still loading
        Then the app should show a loading indicator on the themed background
        And the authenticated shell should appear only after session hydration completes

    # Scenario code: 11.2
    Scenario: Keep an empty overview tab actionable
        Given the tester is signed in and the active tab has no tasks
        When the task list finishes loading
        Then the empty state should describe that there are no tasks yet
        And the floating add action should open the composer

    # Scenario code: 11.3
    Scenario: Recover from a failed task update
        Given an open task is visible in the active list
        When a complete, reopen, edit, or delete request fails
        Then the app should refresh task data from Supabase
        And an error alert should explain the failed action

    # Scenario code: 11.4
    Scenario: Keep pull-to-refresh spinner bounded
        Given the tester is viewing any task list
        When the tester performs pull to refresh and the task request stalls
        Then the visible refresh spinner should stop after the guarded refresh window
        And the existing list content should remain usable

    # Scenario code: 11.5
    Scenario: Keep search and filter empty states clear
        Given the tester opens search or applies filters with no matching tasks
        When the app shows an empty results state
        Then the empty title should distinguish between no query, no matches, and no tasks yet
        And clearing search or filters should restore the normal list state