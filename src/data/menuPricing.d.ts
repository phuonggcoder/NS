import type { MenuItem } from '../types/spec';

export function formatMenuPrice(amount: number, currency?: string): string;
export function getEffectiveBasePrice(item: Pick<MenuItem, 'price' | 'salePrice'>): number;
export function calculateConfiguredItemPrice(
  item: MenuItem,
  selectedChoicesByGroup: Record<string, string[]>,
  quantity?: number
): { unitBase: number; optionsDelta: number; unitTotal: number; lineTotal: number };
export function validateRequiredOptionGroups(
  item: MenuItem,
  selectedChoicesByGroup: Record<string, string[]>
): { valid: boolean; missingGroupIds: string[]; errors: string[] };
export function getDefaultOptionSelections(item: MenuItem): Record<string, string[]>;
