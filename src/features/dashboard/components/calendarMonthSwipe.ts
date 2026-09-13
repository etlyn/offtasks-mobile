type Swipe = {
  dx: number;
  dy: number;
  vx: number;
  numberActiveTouches: number;
};

/** Leave taps and vertical scrolling to the calendar's existing controls. */
export const isCalendarMonthSwipe = (gesture: Swipe) =>
  gesture.numberActiveTouches === 1 &&
  Math.abs(gesture.dx) >= 12 &&
  Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;

export const calendarSwipeDirection = (gesture: Swipe): -1 | 0 | 1 => {
  if (
    gesture.numberActiveTouches > 1 ||
    Math.abs(gesture.dx) <= Math.abs(gesture.dy) * 1.5
  )
    return 0;
  const distance = Math.abs(gesture.dx);
  if (
    distance < 48 &&
    !(
      distance >= 24 &&
      Math.abs(gesture.vx) >= 0.45 &&
      gesture.dx * gesture.vx > 0
    )
  )
    return 0;
  return gesture.dx < 0 ? 1 : -1;
};
