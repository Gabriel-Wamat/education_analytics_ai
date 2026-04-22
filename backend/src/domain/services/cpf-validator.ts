/**
 * Validação de CPF brasileiro:
 *  - 11 dígitos numéricos (após remoção de máscara)
 *  - Não pode ser sequência repetida (000.000.000-00, etc.)
 *  - Os dois dígitos verificadores devem bater com o cálculo padrão.
 */
export const sanitizeCpf = (value: string): string =>
  value.replace(/\D+/g, "");

export const isValidCpf = (value: string): boolean => {
  const digits = sanitizeCpf(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheckDigit = (slice: string, factor: number): number => {
    let sum = 0;
    for (const char of slice) {
      sum += Number(char) * factor;
      factor -= 1;
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstCheck = calcCheckDigit(digits.slice(0, 9), 10);
  if (firstCheck !== Number(digits.charAt(9))) return false;

  const secondCheck = calcCheckDigit(digits.slice(0, 10), 11);
  if (secondCheck !== Number(digits.charAt(10))) return false;

  return true;
};

export const formatCpf = (value: string): string => {
  const digits = sanitizeCpf(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};
