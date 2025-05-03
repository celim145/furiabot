document.getElementById('send').addEventListener('click', async () => {
  const inputField = document.getElementById('input');
  const prompt = inputField.value.trim();
  const chatDiv = document.getElementById('chat');

  function formatarLinks(texto) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return texto.replace(urlRegex, url => `<a href="${url}" target="_blank" class="chat-link">${url}</a>`);
  }

  function adicionarMensagem(texto, classe) {
    const novaMensagem = document.createElement('div');
    novaMensagem.className = `message ${classe}`;
    novaMensagem.innerHTML = texto; // Mantém a formatação de links
    chatDiv.appendChild(novaMensagem);
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }

  if (!prompt) return;

  // Mensagem do usuário (SEM <strong> ou labels)
  adicionarMensagem(prompt, 'user'); // ✅ Alterado
  inputField.value = '';

  try {
    // Loader
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.textContent = 'Processando...';
    chatDiv.appendChild(loader);

    // Fetch
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error(`Erro ${response.status}`);
    const data = await response.json();

    // Remove loader
    chatDiv.removeChild(loader);

    // Processar resposta
    let resposta = data.resposta || data.error;
    resposta = formatarLinks(resposta);

    // Determinar classe
    const classeResposta = resposta.toLowerCase().includes("não posso responder") ||
      resposta.toLowerCase().includes("fora do escopo")
      ? 'bot-warning' : 'bot';

   
    adicionarMensagem(resposta, classeResposta); // ✅ Alterado

  } catch (error) {
    console.error('Erro:', error);
    adicionarMensagem(error.message, 'error'); // Mantém o tratamento de erro
  }
});