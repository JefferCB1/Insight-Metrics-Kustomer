// src/types/index.ts
export interface CXData {
  date: string;
  team: string;
  queue: string;
  agent: string;
  firstResponseTime: number;
  csat: number;
  contactRate: number;
}

export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  team: string;
  queue: string;
  agent: string;
}

export type MetricType = 'firstResponseTime' | 'csat' | 'contactRate';