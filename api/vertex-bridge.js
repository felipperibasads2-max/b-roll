import crypto from 'crypto';

async function getAccessTokenFromServiceAccount(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson);
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: exp,
    iat: iat
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signatureInput = `${base64Header}.${base64Payload}`;
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const privateKey = sa.private_key.replace(/\\n/g, '\n');
  const signature = signer.sign(privateKey, 'base64url');
  
  const jwt = `${signatureInput}.${signature}`;
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`GCP token exchange failed: ${errorText}`);
  }
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

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

  let { url, q } = req.query;
  if (q) {
    try {
      url = Buffer.from(q, 'base64').toString('utf8');
    } catch (err) {
      return res.status(400).json({ error: 'Parâmetro "q" inválido (Base64).' });
    }
  }

  if (!url) {
    return res.status(400).json({ error: 'Parâmetro "url" ou "q" é obrigatório.' });
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
      if (targetUrl.hostname.includes('aiplatform.googleapis.com') && process.env.GCP_VERTEX_API_KEY && !req.headers['authorization']) {
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

    // Apenas injetar o token da conta de serviço para chamadas da Vertex AI (aiplatform.googleapis.com)
    if (!fetchOptions.headers['authorization'] && 
        targetUrl.hostname.includes('aiplatform.googleapis.com') && 
        process.env.GCP_SERVICE_ACCOUNT_KEY) {
      try {
        const token = await getAccessTokenFromServiceAccount(process.env.GCP_SERVICE_ACCOUNT_KEY);
        fetchOptions.headers['authorization'] = `Bearer ${token}`;
      } catch (err) {
        console.error("Erro gerando token via Service Account:", err);
        return res.status(500).json({ 
          error: 'Falha na ponte da Vercel ao gerar token de acesso do Google Cloud.', 
          details: err.message 
        });
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
    console.error('Erro no bridge do Vertex:', error);
    res.status(500).json({ 
      error: 'Falha ao retransmitir requisição através do bridge', 
      details: error.message 
    });
  }
}
