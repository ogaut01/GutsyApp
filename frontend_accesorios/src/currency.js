export function formatGsInput(value) {
  if (value === null || value === undefined || value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('es-PY') : '';
}

export function parseGsInput(value) {
  if (value === null || value === undefined || value === '') return 0;
  const digits = String(value).replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export function formatDecimalInput(value) {
  if (value === null || value === undefined || value === '') return '';
  let str = String(value).replace(/,/g, '.');
  str = str.replace(/[^\d.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
}

export function parseDecimalInput(value) {
  if (value === null || value === undefined || value === '') return 0.0;
  const str = String(value).replace(/,/g, '.').replace(/[^\d.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0.0 : num;
}
