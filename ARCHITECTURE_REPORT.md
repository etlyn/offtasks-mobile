# Mobile Architecture Report

## App Entry

The mobile app starts in `mobile/App.tsx`.

Provider and navigator order:

1. `GestureHandlerRootView`
2. `SafeAreaProvider`
3. `AuthProvider`
4. `PreferencesProvider`
5. `RootNavigator`
6. `TasksProvider` only for authenticated users

## Navigation Tree

```text
App
└── RootNavigator
    ├── unauthenticated
    │   └── Stack
    │       └── Auth
    │           └── LoginScreen
    └── authenticated
        └── Drawer
            ├── Dashboard
            │   └── BottomTabs
            │       ├── Today
            │       │   └── DashboardScreen(group=today)
            │       ├── Tomorrow
            │       │   └── DashboardScreen(group=tomorrow)
            │       └── Later
            │           └── DashboardScreen(group=upcoming)
         └── Statistics
            └── StatisticsScreen
```

## Main Screen

The main authenticated landing flow is now:

`Dashboard -> Today -> DashboardScreen(group=today)`

There is no dedicated authenticated settings screen route. Settings controls live in the drawer content.

## Screen Count

Active route entries:

1. `Auth`
2. `Dashboard`
3. `Today`
4. `Tomorrow`
5. `Later`
6. `Statistics`

Unique active screen components:

1. `LoginScreen`
2. `DashboardScreen`
3. `StatisticsScreen`

## Dashboard Layout Structure

`DashboardScreen` is the core work surface.

Primary layout elements:

1. `TopBar`
   - menu button
   - task count summary
   - current group label
   - search toggle
2. `Layout`
   - scroll container for dashboard content
   - hosts the floating action button
3. `FilterBar`
   - optional advanced filter row
4. `TaskList`
   - renders task rows
   - supports toggle, edit, long press details, and delete swipe
5. `TaskComposerModal`
   - used for both create and edit flows

## Shared State Layers

1. `AuthProvider`
   - session hydration
   - auth state subscription
2. `PreferencesProvider`
   - local preference storage
   - theme mode
   - remote preference sync
3. `TasksProvider`
   - fetches tasks
   - optimistic task updates
   - totals
   - auto-move due tasks
   - widget sync

## Drawer Responsibilities

The drawer is now both navigation and settings surface.

It contains:

1. Home reset back to `Dashboard -> Today`
2. Navigation to `Statistics`
3. Theme toggle
4. Hide completed toggle
5. Advanced mode toggle
6. Auto-move due tasks toggle
7. Version display
8. Sign out action
