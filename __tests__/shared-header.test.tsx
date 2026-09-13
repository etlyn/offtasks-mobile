import React from 'react';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { TaskSearchHeader } from '../src/features/dashboard/components/TaskSearch';
import { PlannerHeader } from '../src/components/navigation/PlannerHeader';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  createHeaderRegistry,
  HeaderLayer,
  HeaderSlot,
  SharedHeaderHost,
  SharedHeaderProvider,
} from '../src/navigation/SharedHeader';
import { OfftasksLoader } from '../src/components/OfftasksLoader';

test('pull refresh activates the existing compact header wordmark without changing header bounds', async () => {
  const motion = jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
  const renderHeader = (refreshing: boolean) => (
    <SharedHeaderProvider>
      <SharedHeaderHost
        onMenu={jest.fn()}
        onSearch={jest.fn()}
        refreshing={refreshing}
      />
    </SharedHeaderProvider>
  );
  const view = render(renderHeader(false));
  await act(async () => {});
  const header = screen.getByTestId('persistent-main-header');
  view.rerender(renderHeader(true));
  expect(screen.UNSAFE_getByType(OfftasksLoader).props).toMatchObject({
    active: true,
    compact: true,
  });
  expect(screen.getByLabelText('Loading').props.accessibilityState.busy).toBe(
    true,
  );
  view.rerender(renderHeader(false));
  expect(screen.getByLabelText('offtasks.').props.accessibilityState.busy).toBe(
    false,
  );
  expect(screen.getByTestId('persistent-main-header')).toBe(header);
  motion.mockRestore();
});

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 48, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({ reduceMotion: true }),
}));
// Mount/unmount models navigation focus/blur for these ownership tests.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ dispatch: jest.fn() }),
  useFocusEffect: (effect: () => void) =>
    require('react').useEffect(effect, [effect]),
}));

test('header registry restores the focused page after a higher-priority overlay leaves', () => {
  const registry = createHeaderRegistry();
  const listener = jest.fn();
  const unsubscribe = registry.subscribe(listener);
  const calendar = { priority: 0, searchLabel: 'Search tasks' };
  const detail = { priority: 10, searchLabel: 'Search goal tasks' };
  const search = { priority: 11, searching: true };
  registry.set('calendar', calendar);
  registry.set('detail', detail);
  registry.set('search', search);
  registry.set('calendar', { ...calendar });
  expect(registry.getSnapshot()).toBe(search);
  registry.remove('search');
  expect(registry.getSnapshot()).toBe(detail);
  registry.remove('detail');
  expect(registry.getSnapshot()?.searchLabel).toBe('Search tasks');
  registry.remove('calendar');
  expect(registry.getSnapshot()).toBeNull();
  expect(listener).toHaveBeenCalledTimes(7);
  unsubscribe();
  registry.set('calendar', calendar);
  expect(listener).toHaveBeenCalledTimes(7);
});

test('closing search lands on the 36-point header circle without a size or position handoff', () => {
  const progress = new Animated.Value(1);
  render(
    <TaskSearchHeader
      registerHeader={false}
      topInset={48}
      value=""
      onChange={jest.fn()}
      onClose={jest.fn()}
      progress={progress}
      fieldProgress={progress}
      ready={false}
      resultCount={0}
    />,
  );
  expect(screen.getByTestId('task-search-expanding-field')).toHaveStyle({
    height: 44,
    marginRight: 0,
  });
  act(() => progress.setValue(0));
  expect(screen.getByTestId('task-search-expanding-field')).toHaveStyle({
    width: 36,
    height: 36,
    marginRight: 4,
    shadowOpacity: 0,
  });
  expect(screen.getByTestId('task-search-full-width')).toHaveStyle({
    height: 44,
    justifyContent: 'center',
  });
});

test('persistent header fades back before the search layer is removed', () => {
  const progress = new Animated.Value(1);
  render(
    <SharedHeaderProvider>
      <SharedHeaderHost
        onMenu={jest.fn()}
        onSearch={jest.fn()}
        covered
        searchProgress={progress}
      />
    </SharedHeaderProvider>,
  );
  const header = () =>
    screen.getByTestId('persistent-main-header', {
      includeHiddenElements: true,
    });
  expect(header()).toHaveStyle({
    opacity: 0,
  });
  act(() => progress.setValue(0));
  expect(header()).toHaveStyle({
    opacity: 1,
  });
  expect(header().props.pointerEvents).toBe('none');
});

test('page changes update actions without replacing or animating the shared header', () => {
  const onMenu = jest.fn();
  const onCalendarSearch = jest.fn();
  const onNotesSearch = jest.fn();
  function Layout({ notes = false }: { notes?: boolean }) {
    return (
      <SharedHeaderProvider>
        <HeaderSlot
          key={notes ? 'notes' : 'calendar'}
          searchLabel={notes ? 'Search notes' : 'Search tasks'}
          onSearch={notes ? onNotesSearch : onCalendarSearch}
        />
        <SharedHeaderHost onMenu={onMenu} onSearch={onCalendarSearch} />
      </SharedHeaderProvider>
    );
  }
  const view = render(<Layout />);
  const host = screen.getByTestId('persistent-header-host');
  const header = screen.getByTestId('persistent-main-header');
  fireEvent.press(screen.getByRole('button', { name: 'Search tasks' }));
  expect(onCalendarSearch).toHaveBeenCalledTimes(1);
  view.rerender(<Layout notes />);
  expect(screen.getByTestId('persistent-header-host')).toBe(host);
  expect(screen.getByTestId('persistent-main-header')).toBe(header);
  expect(header).toHaveStyle({ opacity: 1, paddingTop: 52 });
  expect(screen.getAllByLabelText('offtasks.')).toHaveLength(1);
  fireEvent.press(screen.getByRole('button', { name: 'Search notes' }));
  fireEvent.press(screen.getByRole('button', { name: 'Open navigation menu' }));
  expect(onNotesSearch).toHaveBeenCalledTimes(1);
  expect(onMenu).toHaveBeenCalledTimes(1);
});

test('nested goal search owns the header until dismissal, then restores detail actions', async () => {
  const fallback = jest.fn();
  const detailSearch = jest.fn();
  function Layout({ search = false }: { search?: boolean }) {
    return (
      <SharedHeaderProvider>
        <HeaderSlot onSearch={fallback} />
        <HeaderLayer.Provider value={10}>
          <HeaderSlot onSearch={detailSearch} />
          {search ? (
            <>
              <HeaderSlot searching />
              <Text>Goal search field</Text>
            </>
          ) : null}
        </HeaderLayer.Provider>
        <SharedHeaderHost onMenu={fallback} onSearch={fallback} />
      </SharedHeaderProvider>
    );
  }
  const view = render(<Layout />);
  const header = screen.getByTestId('persistent-main-header');
  view.rerender(<Layout search />);
  expect(screen.getByText('Goal search field')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Search tasks' })).toBeNull();
  view.rerender(<Layout />);
  expect(screen.getByTestId('persistent-main-header')).toBe(header);
  fireEvent.press(screen.getByRole('button', { name: 'Search tasks' }));
  expect(detailSearch).toHaveBeenCalledTimes(1);
  expect(fallback).not.toHaveBeenCalled();
  await act(async () => view.unmount());
});

test('search input stays mounted with its page while the shared header is covered', () => {
  const progress = new Animated.Value(1);
  function Layout() {
    const [query, setQuery] = React.useState('');
    return (
      <SharedHeaderProvider>
        <TaskSearchHeader
          topInset={48}
          value={query}
          onChange={setQuery}
          onClose={jest.fn()}
          progress={progress}
          fieldProgress={progress}
          ready
          resultCount={query ? 1 : 0}
        />
        <SharedHeaderHost onMenu={jest.fn()} onSearch={jest.fn()} />
      </SharedHeaderProvider>
    );
  }
  render(<Layout />);
  const input = screen.getByLabelText('Search all tasks');
  for (const value of ['T', 'Te', 'Test']) {
    fireEvent.changeText(input, value);
    expect(screen.getByLabelText('Search all tasks')).toBe(input);
    expect(input.props.value).toBe(value);
  }
  expect(screen.getAllByLabelText('Search all tasks')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Search tasks' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(input.props.value).toBe('');
});

test('global mode ignores page-specific search actions and labels', () => {
  const local = jest.fn();
  const global = jest.fn();
  function Layout({ label }: { label: string }) {
    return (
      <SharedHeaderProvider>
        <HeaderSlot onSearch={local} searchLabel={label} />
        <SharedHeaderHost globalSearch onMenu={jest.fn()} onSearch={global} />
      </SharedHeaderProvider>
    );
  }
  const view = render(<Layout label="Search notes" />);
  const header = screen.getByTestId('persistent-main-header');
  fireEvent.press(screen.getByRole('button', { name: 'Search' }));
  view.rerender(<Layout label="Search goals" />);
  fireEvent.press(screen.getByRole('button', { name: 'Search' }));
  expect(global).toHaveBeenCalledTimes(2);
  expect(local).not.toHaveBeenCalled();
  expect(screen.getByTestId('persistent-main-header')).toBe(header);
});

test('goal detail swaps menu for back in the same header button and restores it on exit', () => {
  const onMenu = jest.fn();
  const onBack = jest.fn();
  const onSearch = jest.fn();
  function Layout({
    detail = false,
    covered = false,
  }: {
    detail?: boolean;
    covered?: boolean;
  }) {
    return (
      <SharedHeaderProvider>
        <HeaderSlot />
        {detail ? (
          <HeaderLayer.Provider value={10}>
            <PlannerHeader
              title="Health"
              titleInHeader
              onBack={onBack}
              backInHeader
              backLabel="Back to goals"
            />
          </HeaderLayer.Provider>
        ) : null}
        <SharedHeaderHost
          onMenu={onMenu}
          onSearch={onSearch}
          globalSearch
          covered={covered}
        />
      </SharedHeaderProvider>
    );
  }
  const view = render(<Layout />);
  const menu = screen.getByRole('button', { name: 'Open navigation menu' });
  const header = screen.getByTestId('persistent-main-header');
  view.rerender(<Layout detail />);
  const back = screen.getByRole('button', { name: 'Back to goals' });
  expect(back).toBe(menu);
  expect(back).toHaveStyle({ width: 44, height: 44 });
  expect(screen.getByTestId('persistent-main-header')).toBe(header);
  expect(
    screen.queryByRole('button', { name: 'Open navigation menu' }),
  ).toBeNull();
  expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  expect(screen.getByRole('header', { name: 'Health' })).toBeOnTheScreen();
  expect(screen.getAllByText('Health')).toHaveLength(1);
  expect(screen.queryByLabelText('offtasks.')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Search' }));
  expect(onSearch).toHaveBeenCalledTimes(1);
  view.rerender(<Layout detail covered />);
  expect(screen.queryByRole('button', { name: 'Back to goals' })).toBeNull();
  view.rerender(<Layout detail />);
  fireEvent.press(screen.getByRole('button', { name: 'Back to goals' }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onMenu).not.toHaveBeenCalled();
  view.rerender(<Layout />);
  expect(screen.getByRole('button', { name: 'Open navigation menu' })).toBe(
    menu,
  );
  fireEvent.press(menu);
  expect(onMenu).toHaveBeenCalledTimes(1);
});

test('statistics back replaces the menu in the shared header without an extra back row', () => {
  const onBack = jest.fn();
  render(
    <SharedHeaderProvider>
      <PlannerHeader title="Statistics" onBack={onBack} backInHeader />
      <SharedHeaderHost onMenu={jest.fn()} onSearch={jest.fn()} globalSearch />
    </SharedHeaderProvider>,
  );
  expect(screen.queryByLabelText('Open navigation menu')).toBeNull();
  expect(screen.getAllByLabelText('Back')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Back'));
  expect(onBack).toHaveBeenCalledTimes(1);
});
