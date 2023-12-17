import { Option } from './types';

export const options: Option[] = [
  { label: 'Boliger i alt', value: '00' },
  { label: 'Småhus', value: '02' },
  { label: 'Blokkleiligheter', value: '03' },
];

export const getStatisticsQueryData = (houseType: string, quarters: string[]) =>
  JSON.stringify({
    query: [
      {
        code: 'Boligtype',
        selection: {
          filter: 'item',
          values: [houseType],
        },
      },
      {
        code: 'ContentsCode',
        selection: {
          filter: 'item',
          values: ['KvPris'],
        },
      },
      {
        code: 'Tid',
        selection: {
          filter: 'item',
          values: quarters,
        },
      },
    ],
    response: {
      format: 'json-stat2',
    },
  });
