import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cpfParam = searchParams.get('cpf');

  if (!cpfParam) {
    return NextResponse.json(
      { erro: 'CPF_AUSENTE', mensagem: 'O parâmetro CPF é obrigatório para busca.' },
      { status: 400 }
    );
  }

  const cleanCpf = cpfParam.replace(/\D/g, '');

  // Retorna paciente demonstrativo mock para testes no laboratório
  const mockPhotoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%230284c7"/><circle cx="150" cy="110" r="55" fill="%23ffffff"/><path d="M 60 260 C 60 190, 240 190, 240 260 Z" fill="%23ffffff"/></svg>`;

  const pacienteMock = {
    id: `PAC-${cleanCpf.slice(-6)}`,
    nomeCompleto: 'Andre Teste de Mock',
    cpf: cpfParam.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
    dataNascimento: '2001-06-13',
    telefone: '(11) 99853-4725',
    fotoBiometricaUrl: mockPhotoSvg,
    consentTimestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
    atualizadoEm: new Date(Date.now() - 30 * 86400000).toISOString(),
  };

  return NextResponse.json({
    sucesso: true,
    paciente: pacienteMock,
  });
}
