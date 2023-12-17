export interface Dataset {
  version: string;
  class: string;
  label: string;
  source: string;
  updated: string;
  note: string[];
  role: {
    time: string[];
    metric: string[];
  };
  id: string[];
  size: number[];
  dimension: {
    Boligtype: {
      label: string;
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
      extension: {
        elimination: boolean;
        eliminationValueCode: string;
        show: string;
      };
      link: {
        describedby: {
          extension: {
            Boligtype: string;
          };
        }[];
      };
    };
    ContentsCode: {
      label: string;
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
        unit: {
          KvPris: {
            base: string;
            decimals: number;
          };
        };
      };
      extension: {
        elimination: boolean;
        refperiod: {
          KvPris: string;
        };
        show: string;
      };
    };
    Tid: {
      label: string;
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
      extension: {
        elimination: boolean;
        show: string;
      };
    };
  };
  extension: {
    px: {
      infofile: string;
      tableid: string;
      decimals: number;
      'official-statistics': boolean;
      aggregallowed: boolean;
      language: string;
      matrix: string;
      'subject-code': string;
    };
    contact: {
      name: string;
      phone: string;
      mail: string;
      raw: string;
    }[];
  };
  value: number[];
}
