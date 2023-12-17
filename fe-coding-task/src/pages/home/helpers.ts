import { DEBOUNCE_DELAY } from 'utils/constants';

export const generateQuarterRange = (quarterStart: string, quarterEnd: string) => {
  const quarters: string[] = [];
  let [startYear, startQuarter] = quarterStart.split('K');
  let [endYear, endQuarter] = quarterEnd.split('K');

  if (startYear > endYear) {
    [startYear, endYear] = [endYear, startYear];
    [startQuarter, endQuarter] = [endQuarter, startQuarter];
  }

  let currentYear = parseInt(startYear, 10);
  let currentQuarter = parseInt(startQuarter, 10);

  while (!(currentYear === parseInt(endYear, 10) && currentQuarter === parseInt(endQuarter, 10))) {
    quarters.push(`${currentYear}K${currentQuarter}`);

    currentQuarter++;
    if (currentQuarter > 4) {
      currentQuarter = 1;
      currentYear++;
    }
  }

  quarters.push(`${endYear}K${endQuarter}`);

  return quarters;
};

// as I discovered mui has it own debounce function, but I didn't know it, so I wrote it by myself
export const debounce = (fn: any, delay: number = DEBOUNCE_DELAY) => {
  let timeoutId: any;
  const debounced = (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
  return debounced;
};
