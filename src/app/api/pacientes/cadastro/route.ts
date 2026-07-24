import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nomeCompleto = formData.get('nomeCompleto') as string;
    const cpf = formData.get('cpf') as string;
    const dataNascimento = formData.get('dataNascimento') as string;
    const telefone = formData.get('telefone') as string;
    const consentTimestamp = formData.get('consentTimestamp') as string;
    
    // Fotos dos 5 ângulos biométricos
    const fotoFrente = (formData.get('foto_frente') || formData.get('fotoBiometrica')) as File | null;
    const fotoDireita = formData.get('foto_direita') as File | null;
    const fotoEsquerda = formData.get('foto_esquerda') as File | null;
    const fotoCima = formData.get('foto_cima') as File | null;
    const fotoBaixo = formData.get('foto_baixo') as File | null;

    if (!nomeCompleto || !cpf || !dataNascimento || !telefone) {
      return NextResponse.json(
        { erro: 'CAMPOS_OBRIGATORIOS', mensagem: 'Todos os dados cadastrais do paciente são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!consentTimestamp) {
      return NextResponse.json(
        { erro: 'CONSENTIMENTO_LGPD_AUSENTE', mensagem: 'O aceite do termo LGPD com timestamp é obrigatório.' },
        { status: 400 }
      );
    }

    if (!fotoFrente) {
      return NextResponse.json(
        { erro: 'FOTO_AUSENTE', mensagem: 'A captura da biometria facial de frente é obrigatória.' },
        { status: 400 }
      );
    }

    // Simula salvamento no banco de dados e gera ID de prontuário
    const pacienteId = `PAC-${Math.floor(100000 + Math.random() * 900000)}`;

    const angulosRecebidos = [
      fotoFrente && 'frente',
      fotoDireita && 'direita',
      fotoEsquerda && 'esquerda',
      fotoCima && 'cima',
      fotoBaixo && 'baixo',
    ].filter(Boolean);

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Cadastro biométrico de 5 ângulos faciais realizado com sucesso!',
      paciente: {
        id: pacienteId,
        nomeCompleto,
        cpf,
        dataNascimento,
        telefone,
        consentTimestamp,
        angulosCapturados: angulosRecebidos,
        totalFotos: angulosRecebidos.length,
        fotoTamanhoBytes: fotoFrente.size,
        criadoEm: new Date().toISOString(),
      },
    });
  } catch (err: unknown) {
    console.error('Erro na API de cadastro de paciente:', err);
    return NextResponse.json(
      { erro: 'ERRO_INTERNO', mensagem: 'Falha interna no processamento do cadastro biométrico.' },
      { status: 500 }
    );
  }
}
