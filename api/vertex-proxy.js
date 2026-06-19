// Vercel Serverless Function: Proxy CORS para APIs do Google (Vertex AI e Gemini)
// Evita a necessidade de usar extensões de CORS no navegador em produção.

export default async function handler(req, res) {
  // Habilitar CORS Headers para desenvolvimento local
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Tratar requisição OPTIONS (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Parâmetro "url" é obrigatório na query.' });
  }

  try {
    const targetUrl = new URL(url);

    // Validação de segurança: permite apenas requisições para domínios da Google API
    if (!targetUrl.hostname.endsWith('.googleapis.com')) {
      return res.status(403).json({ 
        error: 'Acesso negado. Este proxy permite apenas conexões com *.googleapis.com por motivos de segurança.' 
      });
    }

    // Injetar chave das variáveis de ambiente se não estiver presente na URL
    if (!targetUrl.searchParams.has('key')) {
      if (targetUrl.hostname.includes('aiplatform.googleapis.com') && process.env.GCP_VERTEX_API_KEY) {
        targetUrl.searchParams.set('key', process.env.GCP_VERTEX_API_KEY);
      } else if (targetUrl.hostname.includes('generativelanguage.googleapis.com') && process.env.GEMINI_API_KEY) {
        targetUrl.searchParams.set('key', process.env.GEMINI_API_KEY);
      }
    }

    // Configurações do fetch para o destino
    const fetchOptions = {
      method: req.method,
      headers: {
        'Accept': 'application/json',
      }
    };

    // Repassar os headers relevantes vindos do cliente
    const headersToForward = [
      'content-type',
      'authorization',
      'x-goog-user-project',
      'x-goog-api-key',
      'x-goog-api-client'
    ];

    for (const header of headersToForward) {
      if (req.headers[header]) {
        fetchOptions.headers[header] = req.headers[header];
      }
    }

    // Repassar o corpo da requisição em métodos de escrita
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.body) {
        // A Vercel faz o parse do body automaticamente se for JSON
        fetchOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
      }
    }

    // Realizar a chamada à API do Google a partir do backend da Vercel
    const response = await fetch(targetUrl.toString(), fetchOptions);

    
    // Ler os dados retornados
    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }

    // Retornar a resposta original e o status para o navegador
    res.status(response.status).json(data);

  } catch (error) {
    console.error('Erro no proxy do Vertex:', error);
    res.status(500).json({ 
      error: 'Falha ao retransmitir requisição através do proxy', 
      details: error.message 
    });
  }
}
