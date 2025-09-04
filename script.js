// Configurações do Airtable
// IMPORTANTE: Configure estas variáveis no Replit Secrets
const AIRTABLE_API_KEY = 'patJix2omRTtt05A1.68b4ca3b34bf8e795500f726b71726809a2eef9604c579e54b05be0d7454a273'; // Será configurado via Replit Secrets
const AIRTABLE_BASE_ID = 'appcKOxe8Gqark2T3'; // Coloque seu Base ID aqui
const AIRTABLE_TABLE_NAME = 'Clientes'; // Nome da tabela no Airtable
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;

// Elementos do DOM
const clientForm = document.getElementById('clientForm');
const clientsList = document.getElementById('clientsList');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');

// Estado da aplicação
let editingId = null;
let clients = [];

/**
 * Função para mostrar alertas na interface
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de alerta (success ou error)
 */
function showAlert(message, type = 'success') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';

    // Esconder o alerta após 5 segundos
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

/**
 * Configura os headers para as requisições HTTP
 * @returns {Object} Headers configurados
 */
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
    };
}

/**
 * Busca todos os clientes do Airtable
 */
async function fetchClients() {
    try {
        // Mostrar estado de carregamento
        clientsList.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
            </div>
        `;

        // Fazer requisição para a API do Airtable
        const response = await fetch(AIRTABLE_URL, {
            headers: getHeaders()
        });

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao buscar clientes: ${response.status}`);
        }

        // Processar resposta
        const data = await response.json();
        clients = data.records;

        // Renderizar clientes na interface
        renderClients();
    } catch (error) {
        console.error('Erro:', error);
        clientsList.innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar clientes. Verifique sua conexão e tente novamente.
            </div>
        `;
    }
}

/**
 * Renderiza a lista de clientes na interface
 */
function renderClients() {
    // Verificar se não há clientes
    if (clients.length === 0) {
        clientsList.innerHTML = `
            <div class="empty-state">
                <i>📝</i>
                <h3>Nenhum cliente cadastrado</h3>
                <p>Adicione seu primeiro cliente usando o formulário acima.</p>
            </div>
        `;
        return;
    }

    // Gerar HTML para cada cliente
    clientsList.innerHTML = `
        <div class="grid">
            ${clients.map(client => `
                <div class="client-card" data-id="${client.id}">
                    <div class="client-name">${client.fields.Nome || 'Sem nome'}</div>
                    <div class="client-info">
                        <i>✉️</i> ${client.fields.Email || 'Não informado'}
                    </div>
                    <div class="client-info">
                        <i>📞</i> ${client.fields.Telefone || 'Não informado'}
                    </div>
                    <div class="actions">
                        <button class="btn-edit btn-sm" onclick="editClient('${client.id}')">Editar</button>
                        <button class="btn-danger btn-sm" onclick="deleteClient('${client.id}')">Excluir</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Salva um cliente (cria ou atualiza)
 * @param {Object} clientData - Dados do cliente a serem salvos
 */
async function saveClient(clientData) {
    try {
        let url = AIRTABLE_URL;
        let method = 'POST';

        // Se estiver editando, altera a URL e o método
        if (editingId) {
            url += `/${editingId}`;
            method = 'PATCH';
        }

        // Fazer requisição para salvar os dados
        const response = await fetch(url, {
            method: method,
            headers: getHeaders(),
            body: JSON.stringify({
                fields: {
                    Nome: clientData.name,
                    Email: clientData.email,
                    Telefone: clientData.phone
                }
            })
        });

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao ${editingId ? 'atualizar' : 'criar'} cliente: ${response.status}`);
        }

        // Mostrar mensagem de sucesso
        showAlert(
            editingId ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
            'success'
        );

        // Resetar o formulário
        clientForm.reset();
        editingId = null;
        submitBtn.textContent = 'Cadastrar Cliente';

        // Recarregar a lista de clientes
        fetchClients();
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao salvar cliente. Tente novamente.', 'error');
    }
}

/**
 * Preenche o formulário para edição de um cliente
 * @param {string} id - ID do cliente a ser editado
 */
function editClient(id) {
    const client = clients.find(c => c.id === id);

    if (client) {
        // Preencher formulário com dados do cliente
        document.getElementById('name').value = client.fields.Nome || '';
        document.getElementById('email').value = client.fields.Email || '';
        document.getElementById('phone').value = client.fields.Telefone || '';

        // Atualizar estado para modo de edição
        editingId = id;
        submitBtn.textContent = 'Atualizar Cliente';

        // Scroll para o formulário
        clientForm.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Exclui um cliente
 * @param {string} id - ID do cliente a ser excluído
 */
async function deleteClient(id) {
    // Confirmar exclusão
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }

    try {
        // Fazer requisição para excluir
        const response = await fetch(`${AIRTABLE_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        // Verificar se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao excluir cliente: ${response.status}`);
        }

        // Mostrar mensagem de sucesso
        showAlert('Cliente excluído com sucesso!', 'success');

        // Recarregar lista de clientes
        fetchClients();
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro ao excluir cliente. Tente novamente.', 'error');
    }
}

// Event listener para o formulário
clientForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Obter dados do formulário
    const clientData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    // Validação básica
    if (!clientData.name || !clientData.email || !clientData.phone) {
        showAlert('Por favor, preencha todos os campos.', 'error');
        return;
    }

    // Salvar cliente
    saveClient(clientData);
});

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se as configurações estão definidas
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
        showAlert('Configure corretamente as variáveis do Airtable para usar o sistema.', 'error');
        return;
    }

    // Carregar clientes
    fetchClients();
});