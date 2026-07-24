/**
 * Formata um número de telefone com máscara (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 10) {
    // Celular com 9 dígitos
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  } else if (digits.length > 5) {
    // Telefone fixo ou digitando
    return digits
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else if (digits.length > 2) {
    return digits.replace(/^(\d{2})(\d)/g, '($1) $2');
  }
  return digits;
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function validatePhone(phone: string): boolean {
  const clean = cleanPhone(phone);
  return clean.length === 10 || clean.length === 11;
}
