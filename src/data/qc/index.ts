import t2Leak25 from './t2-leak-25.json';

export type QcIndustry = { id: string; label: string };

export type QcItem = {
  id: string;
  no: number;
  title: string;
  description: string;
  who: string;
  examples: Record<string, string>;
};

export type QcZone = {
  id: string;
  name: string;
  label: string;
  note: string;
  items: QcItem[];
};

export type QcChecklist = {
  slug: string;
  code: string;
  title: string;
  titleAccent: string;
  kicker: string;
  lead: string;
  description: string;
  disclaimer: string;
  storageKey: string;
  lineKeyword: string;
  source: string;
  industries: QcIndustry[];
  zones: QcZone[];
};

/** Every checklist published under /qc/<slug>. Add a JSON file + one entry here. */
export const QC_CHECKLISTS: QcChecklist[] = [t2Leak25 as QcChecklist];

export const totalItems = (checklist: QcChecklist): number =>
  checklist.zones.reduce((sum, zone) => sum + zone.items.length, 0);
