/**
  * Formata uma string de CPF pura ou parcial para a máscara 000.000.000-00
  */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
  * Remove todos os caracteres não numéricos
  */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
  * Valida o CPF através do algoritmo matemático dos dígitos verificadores (DV)
  */
export function validateCPF(cpf: string): boolean {
  const clean = cleanCPF(cpf);

  // CPF precisa ter exatamente 11 dígitos
  if (clean.length !== 11) {
    return false;
  }

  // Elimina CPFs inválidos conhecidos (todos os dígitos iguais)
  if (/^(\d)\1{10}$/.test(clean)) {
    return false;
  }

  // Valida 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) {
    rev = 0;
  }
  if (rev !== parseInt(clean.charAt(9), 10)) {
    return false;
  }

  // Valida 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) {
    rev = 0;
  }
  if (rev !== parseInt(clean.charAt(10), 10)) {
    return false;
  }

  return true;
}
