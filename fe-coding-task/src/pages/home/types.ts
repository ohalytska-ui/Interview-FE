export interface Option {
  label: string;
  value: string;
}

export interface PrevFormDataType {
  label: string;
  value: FormInput;
}

export interface StatisticsFormDataType {
  timestamp: number;
  data: FormInput;
}

export interface FormInput {
  quarterStart: string;
  quarterEnd: string;
  houseType: string;
}

export enum FormInputs {
  HouseType = 'houseType',
  QuarterStart = 'quarterStart',
  QuarterEnd = 'quarterEnd',
}
