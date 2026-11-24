export function formatMenuPrice(amount, currency = 'đ') {
  if (!Number.isFinite(amount) || amount < 0) return `0${currency}`;
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('vi-VN').format(rounded);
  return currency === '$' || currency === 'USD'
    ? `${currency}${formatted}`
    : `${formatted}${currency}`;
}

export function getEffectiveBasePrice(item) {
  if (
    typeof item?.salePrice === 'number' &&
    Number.isFinite(item.salePrice) &&
    item.salePrice > 0 &&
    item.salePrice < item.price
  ) {
    return item.salePrice;
  }
  return Math.max(0, Number(item?.price) || 0);
}

export function calculateConfiguredItemPrice(item, selectedChoicesByGroup = {}, quantity = 1) {
  const unitBase = getEffectiveBasePrice(item);
  let optionsDelta = 0;

  for (const group of item?.optionGroups || []) {
    const selectedIds = new Set(selectedChoicesByGroup[group.id] || []);
    for (const choice of group.choices || []) {
      if (selectedIds.has(choice.id)) {
        optionsDelta += Number(choice.priceDelta) || 0;
      }
    }
  }

  const unitTotal = Math.max(0, unitBase + optionsDelta);
  const qty = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
  return {
    unitBase,
    optionsDelta,
    unitTotal,
    lineTotal: unitTotal * qty,
  };
}

export function validateRequiredOptionGroups(item, selectedChoicesByGroup = {}) {
  const missingGroupIds = [];
  const errors = [];

  for (const group of item?.optionGroups || []) {
    const selected = selectedChoicesByGroup[group.id] || [];
    const minRequired = group.required ? Math.max(1, group.minSelect ?? 1) : group.minSelect ?? 0;

    if (selected.length < minRequired) {
      missingGroupIds.push(group.id);
      errors.push(`Vui lòng chọn ít nhất ${minRequired} tùy chọn cho "${group.name}".`);
    }
    if (group.type === 'multiple' && group.maxSelect && selected.length > group.maxSelect) {
      missingGroupIds.push(group.id);
      errors.push(`"${group.name}" chỉ được chọn tối đa ${group.maxSelect} mục.`);
    }
  }

  return {
    valid: missingGroupIds.length === 0,
    missingGroupIds,
    errors,
  };
}

export function getDefaultOptionSelections(item) {
  const out = {};
  for (const group of item?.optionGroups || []) {
    const defaults = (group.choices || []).filter((c) => c.defaultSelected).map((c) => c.id);
    if (defaults.length > 0) {
      out[group.id] = group.type === 'single' ? [defaults[0]] : defaults;
    } else if (group.required && group.type === 'single' && (group.choices || []).length > 0) {
      out[group.id] = [group.choices[0].id];
    } else {
      out[group.id] = [];
    }
  }
  return out;
}
