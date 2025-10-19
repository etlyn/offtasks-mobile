export const getToday = () => {
  const currentDate = new Date();
  return [
    currentDate.getFullYear(),
    (currentDate.getMonth() + 1).toString().padStart(2, '0'),
    currentDate.getDate().toString().padStart(2, '0'),
  ].join('-');
};

export const getAdjacentDay = (delta: number) => {
  const date = new Date();
  date.setDate(date.getDate() + delta);
  return [
    date.getFullYear(),
    (date.getMonth() + 1).toString().padStart(2, '0'),
    date.getDate().toString().padStart(2, '0'),
  ].join('-');
};

export const useDateHelpers = () => ({
  today: getToday(),
  tomorrow: getAdjacentDay(1),
  yesterday: getAdjacentDay(-1),
});
