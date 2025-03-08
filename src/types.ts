export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  urlPattern: string;
  titlePattern: string;
  replacement: string;
  priority: number;
}