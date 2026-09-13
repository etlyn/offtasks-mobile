import { act, renderHook } from '@testing-library/react-native';
import { useSearchTransition } from '../src/features/dashboard/components/useSearchTransition';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('interrupted opening reverses, retains the overlay, and can reopen without a reset', () => {
  const onClosed = jest.fn();
  const { result, rerender, unmount } = renderHook<
    ReturnType<typeof useSearchTransition>,
    { visible: boolean }
  >(({ visible }) => useSearchTransition(visible, false, onClosed), {
    initialProps: { visible: false },
  });
  const fieldProgress = result.current.fieldProgress;
  expect(result.current.mounted).toBe(false);
  rerender({ visible: true });
  act(() => jest.advanceTimersByTime(180));
  expect(result.current.ready).toBe(false);
  rerender({ visible: false });
  expect(result.current.mounted).toBe(true);
  act(() => jest.advanceTimersByTime(100));
  expect(onClosed).not.toHaveBeenCalled();
  rerender({ visible: true });
  expect(result.current.fieldProgress === fieldProgress).toBe(true);
  act(() => jest.advanceTimersByTime(450));
  expect(result.current.ready).toBe(true);
  expect(onClosed).not.toHaveBeenCalled();
  rerender({ visible: false });
  act(() => jest.advanceTimersByTime(370));
  expect(result.current.mounted).toBe(false);
  expect(result.current.ready).toBe(false);
  expect(onClosed).toHaveBeenCalledTimes(1);
  unmount();
});

test('enabling Reduce Motion during a transition settles immediately and unmount cancels callbacks', () => {
  const onClosed = jest.fn();
  const { result, rerender, unmount } = renderHook<
    ReturnType<typeof useSearchTransition>,
    { visible: boolean; reduced: boolean }
  >(({ visible, reduced }) => useSearchTransition(visible, reduced, onClosed), {
    initialProps: { visible: true, reduced: false },
  });
  act(() => jest.advanceTimersByTime(100));
  rerender({ visible: true, reduced: true });
  expect(result.current.ready).toBe(true);
  rerender({ visible: false, reduced: true });
  expect(result.current.mounted).toBe(false);
  expect(onClosed).toHaveBeenCalledTimes(1);
  rerender({ visible: true, reduced: false });
  act(() => jest.advanceTimersByTime(100));
  rerender({ visible: false, reduced: false });
  unmount();
  act(() => jest.runAllTimers());
  expect(onClosed).toHaveBeenCalledTimes(1);
});
