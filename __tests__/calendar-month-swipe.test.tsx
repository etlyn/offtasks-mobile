import React from 'react';
import {
  PanResponder,
  type PanResponderGestureState,
  type GestureResponderEvent,
} from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MonthCalendar } from '../src/features/dashboard/components/MonthCalendar';
import {
  calendarSwipeDirection,
  isCalendarMonthSwipe,
} from '../src/features/dashboard/components/calendarMonthSwipe';

jest.mock('../src/providers/PreferencesProvider', () => ({
  usePreferences: () => ({ themeMode: 'Light' }),
}));
jest.mock('../src/features/dashboard/components/useCalendarTransition', () => ({
  useCalendarTransition: () => ({
    reduceMotion: true,
    animateLayout: jest.fn(),
  }),
}));

const gesture = (dx: number, dy = 0, vx = 0, touches = 1) =>
  ({ dx, dy, vx, numberActiveTouches: touches } as PanResponderGestureState);
afterEach(() => jest.restoreAllMocks());

test('recognizes deliberate horizontal swipes without taking taps, vertical scroll, or multi-touch', () => {
  expect(isCalendarMonthSwipe(gesture(8))).toBe(false);
  expect(isCalendarMonthSwipe(gesture(20, 35))).toBe(false);
  expect(isCalendarMonthSwipe(gesture(60, 0, 0, 2))).toBe(false);
  expect(isCalendarMonthSwipe(gesture(-30, 5))).toBe(true);
  expect(calendarSwipeDirection(gesture(-70))).toBe(1);
  expect(calendarSwipeDirection(gesture(70))).toBe(-1);
  expect(calendarSwipeDirection(gesture(35))).toBe(0);
  expect(calendarSwipeDirection(gesture(-30, 0, -0.6))).toBe(1);
  expect(calendarSwipeDirection(gesture(-30, 0, 0.6))).toBe(0);
  expect(calendarSwipeDirection(gesture(60, 70))).toBe(0);
});

function setup(day: string, expanded = true) {
  const create = jest.spyOn(PanResponder, 'create');
  const onChange = jest.fn();
  const view = render(
    <MonthCalendar
      day={day}
      expanded={expanded}
      onChange={onChange}
      tasks={[]}
    />,
  );
  const config = create.mock.calls[create.mock.calls.length - 1][0];
  const event = {} as GestureResponderEvent;
  const swipe = (dx: number) =>
    act(() => {
      config.onPanResponderGrant?.(event, gesture(0));
      config.onPanResponderRelease?.(event, gesture(dx, 0, 0, 0));
    });
  return { view, onChange, config, event, swipe };
}

test('expanded swipes browse adjacent months across years without selecting a date', () => {
  const { swipe, onChange } = setup('2026-12-30');
  swipe(-80);
  expect(screen.getByText('January 2027')).toBeTruthy();
  swipe(80);
  expect(screen.getByText('December 2026')).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

test('collapsed swipes move months, clamp short months, and preserve the view on expansion', () => {
  const { swipe, onChange, view } = setup('2028-01-31', false);
  swipe(-80);
  expect(screen.getByLabelText('Tuesday, February 29, 2028')).toBeTruthy();
  expect(screen.queryByTestId('calendar-month')).toBeNull();
  swipe(-80);
  expect(screen.getByLabelText('Friday, March 31, 2028')).toBeTruthy();
  view.rerender(
    <MonthCalendar day="2028-01-31" expanded onChange={onChange} tasks={[]} />,
  );
  expect(screen.getByText('March 2028')).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

test('rapid swipes accumulate and selecting a day resets the browsed viewport', () => {
  const { config, event, view, onChange } = setup('2026-09-12', false);
  act(() => {
    config.onPanResponderRelease?.(event, gesture(-80));
    config.onPanResponderRelease?.(event, gesture(-80));
  });
  expect(screen.getByLabelText('Thursday, November 12, 2026')).toBeTruthy();
  view.rerender(
    <MonthCalendar
      day="2026-09-13"
      expanded={false}
      onChange={onChange}
      tasks={[]}
    />,
  );
  expect(screen.getByLabelText('Sunday, September 13, 2026')).toBeTruthy();
});

test('cancelled and multi-touch gestures do not browse, and compact mode offers accessible month actions', () => {
  const { config, event } = setup('2026-09-12', false);
  act(() => {
    config.onPanResponderGrant?.(event, gesture(0));
    config.onPanResponderMove?.(event, gesture(-80, 0, 0, 2));
    config.onPanResponderRelease?.(event, gesture(-80));
  });
  expect(screen.getByLabelText(/Saturday, September 12, 2026/)).toBeTruthy();
  fireEvent(screen.getByLabelText('Expand calendar'), 'accessibilityAction', {
    nativeEvent: { actionName: 'nextMonth' },
  });
  expect(screen.getByLabelText('Monday, October 12, 2026')).toBeTruthy();
});

test('coalesced start/end swipes browse once without selecting the touched day', () => {
  const { onChange } = setup('2026-09-12');
  const card = screen.getByTestId('calendar-month');
  const start = {
    nativeEvent: { pageX: 300, pageY: 200, timestamp: 100, touches: [{}] },
  };
  const end = {
    nativeEvent: { pageX: 80, pageY: 202, timestamp: 200, touches: [] },
  };
  act(() => card.props.onTouchStart(start));
  fireEvent.press(screen.getByLabelText(/Saturday, September 12, 2026/), end);
  act(() => card.props.onTouchEnd(end));
  expect(screen.getByText('October 2026')).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
});

test('responder swipe and touch-end fallback never both navigate', () => {
  const { config, event } = setup('2026-09-12');
  const card = screen.getByTestId('calendar-month');
  act(() =>
    card.props.onTouchStart({
      nativeEvent: { pageX: 300, pageY: 200, timestamp: 100, touches: [{}] },
    }),
  );
  act(() => config.onPanResponderGrant?.(event, gesture(0)));
  act(() =>
    card.props.onTouchEnd({
      nativeEvent: { pageX: 80, pageY: 200, timestamp: 200, touches: [] },
    }),
  );
  act(() => config.onPanResponderRelease?.(event, gesture(-220)));
  expect(screen.getByText('October 2026')).toBeTruthy();
});

test('cancelled touch fallback leaves the month unchanged and a later tap still selects a day', () => {
  const { onChange } = setup('2026-09-12');
  const card = screen.getByTestId('calendar-month');
  const start = {
    nativeEvent: { pageX: 300, pageY: 200, timestamp: 100, touches: [{}] },
  };
  act(() => {
    card.props.onTouchStart(start);
    card.props.onTouchCancel();
    card.props.onTouchEnd({
      nativeEvent: { pageX: 80, pageY: 200, timestamp: 200, touches: [] },
    });
  });
  expect(screen.getByText('September 2026')).toBeTruthy();
  act(() => card.props.onTouchStart(start));
  fireEvent.press(screen.getByLabelText(/Saturday, September 12, 2026/), start);
  expect(onChange).toHaveBeenCalledWith('2026-09-12');
});
