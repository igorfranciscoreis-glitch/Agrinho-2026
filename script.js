// =========================================================================
// 1. MAPEAMENTO DO HTML (Selecionando os elementos da página para o JS usar)
// =========================================================================

// Captura o formulário de cadastro para podermos ouvir quando ele for enviado (salvo)
const form = document.getElementById('form-atividade');

// Captura o container (a div) onde os cards das tarefas serão desenhados na tela
const listaTarefasContainer = document.getElementById('lista-tarefas');

// Captura os elementos de texto dos contadores do painel superior
const totalPendentesEl = document.getElementById('total-pendentes');
const totalConcluidasEl = document.getElementById('total-concluidas');

// Captura os elementos de entrada dos filtros (campo de texto e caixa de seleção)
const filtroLote = document.getElementById('filtro-lote');
const filtroStatus = document.getElementById('filtro-status');


// =========================================================================
// 2. BANCO DE DADOS LOCAL (Memória do Navegador)
// =========================================================================

// Tenta buscar a lista de tarefas salva no navegador ('diario_agricola_tarefas').
// O JSON.parse transforma o texto guardado de volta em um array de objetos.
// Se não houver nada salvo ainda, o operador '||' cria um array vazio [] para começar.
let tarefas = JSON.parse(localStorage.getItem('diario_agricola_tarefas')) || [];


// =========================================================================
// 3. FUNÇÕES DO SISTEMA (Gerenciamento e Lógica)
// =========================================================================

/**
 * Função para atualizar o armazenamento local (localStorage) toda vez que houver alterações.
 * O JSON.stringify converte o nosso array de dados em texto simples, exigência do navegador.
 */
function salvarNoLocalStorage() {
    localStorage.setItem('diario_agricola_tarefas', JSON.stringify(tarefas));
}

/**
 * Função que calcula a quantidade de tarefas em cada status (pendente/concluída)
 * e injeta esses valores numéricos diretamente na tela do site.
 */
function atualizarContadores() {
    // .filter cria uma sublista contendo apenas os itens que cumprem a condição especificada
    const pendentes = tarefas.filter(t => t.status === 'pendente').length;
    const concluidas = tarefas.filter(t => t.status === 'concluida').length;

    // Altera o texto dos contadores na interface do usuário
    totalPendentesEl.textContent = pendentes;
    totalConcluidasEl.textContent = concluidas;
}

/**
 * A função mais importante. Ela lê os dados e os filtros digitados pelo usuário,
 * reconstrói o HTML interno da lista de tarefas e exibe os cards corretos.
 */
function renderizarTarefas() {
    // 1. Limpa completamente o container para evitar que o site duplique cards antigos
    listaTarefasContainer.innerHTML = '';

    // 2. Lê os termos atuais que estão digitados na área de filtros
    const termoBuscaLote = filtroLote.value.toLowerCase().trim();
    const statusFiltro = filtroStatus.value;

    // 3. Aplica os filtros combinados (Lote e Status) sobre o nosso array principal
    const tarefasFiltradas = tarefas.filter(tarefa => {
        // Verifica se o lote da tarefa contém o texto digitado na busca
        const bateLote = tarefa.lote.toLowerCase().includes(termoBuscaLote);
        // Verifica se o status bate com a seleção (ou ignora se for selecionado 'todos')
        const bateStatus = statusFiltro === 'todos' || tarefa.status === statusFiltro;
        
        // Retorna verdadeiro se a tarefa passar em ambos os filtros
        return bateLote && bateStatus;
    });

    // 4. Se a lista resultante estiver vazia, exibe um aviso centralizado na tela
    if (tarefasFiltradas.length === 0) {
        listaTarefasContainer.innerHTML = '<p style="text-align:center; color:#A3B8AC; padding:20px; font-style: italic;">Nenhum registro encontrado.</p>';
        return;
    }

    // 5. Varre a lista filtrada e cria a estrutura HTML visual para cada um dos objetos
    tarefasFiltradas.forEach(tarefa => {
        // Cria um elemento div na memória do JavaScript
        const card = document.createElement('div');
        
        // Atribui as classes CSS corretas. O uso de template literals permite injetar a prioridade de forma dinâmica
        card.className = `card-tarefa prioridade-${tarefa.prioridade.toLowerCase()}`;
        
        // Modifica a opacidade caso o card represente uma tarefa finalizada (estilo visual opaco)
        if (tarefa.status === 'concluida') {
            card.style.opacity = '0.65';
            card.style.background = '#060a07';
        }

        // Formata a data vinda do input (AAAA-MM-DD) para a leitura humana padrão (DD/MM/AAAA)
        // O split separa nos traços, o reverse inverte as posições e o join junta usando barras.
        const dataFormatada = tarefa.data ? tarefa.data.split('-').reverse().join('/') : '---';

        // Constrói o esqueleto interno do card injetando os valores das propriedades do objeto
        card.innerHTML = `
            <div class="badge-prioridade">
                ${tarefa.prioridade.toUpperCase()}
            </div>
            <h3 style="${tarefa.status === 'concluida' ? 'text-decoration: line-through; color: #627A6D;' : ''}">${tarefa.atividade}</h3>
            <p><strong>Data:</strong> ${dataFormatada}</p>
            <p><strong>Local/Lote:</strong> ${tarefa.lote}</p>
            <p><strong>Cultura:</strong> ${tarefa.cultura}</p>
            ${tarefa.observacoes ? `<p><em>Obs: ${tarefa.observacoes}</em></p>` : ''}
            
            <div class="acoes-card">
                ${tarefa.status === 'pendente' 
                    ? `<button class="btn-concluir" onclick="alternarStatus(${tarefa.id})">✔ Concluir</button>` 
                    : `<button class="btn-concluir" style="background:#26402e; color:#00ff66;" onclick="alternarStatus(${tarefa.id})">↩ Reabrir</button>`
                }
                <button class="btn-excluir" onclick="excluirTarefa(${tarefa.id})">Excluir</button>
            </div>
        `;

        // Coloca o card que acabamos de montar para dentro da seção visível na tela
        listaTarefasContainer.appendChild(card);
    });
}


// =========================================================================
// 4. PROCESSADORES DE EVENTO (Ações executadas ao interagir com o site)
// =========================================================================

/**
 * Evento disparado no momento em que o formulário de cadastro é enviado.
 */
form.addEventListener('submit', function(event) {
    // Interrompe o comportamento padrão do HTML que recarregaria a página inteira ao enviar dados
    event.preventDefault();

    // Cria um objeto estruturado contendo as propriedades digitadas pelo usuário nos campos
    const novaTarefa = {
        // Gera um identificador numérico único para esta tarefa baseado nos milissegundos atuais
        id: Date.now(), 
        data: document.getElementById('data').value,
        lote: document.getElementById('lote').value,
        cultura: document.getElementById('cultura').value,
        atividade: document.getElementById('atividade').value,
        prioridade: document.getElementById('prioridade').value,
        observacoes: document.getElementById('observacoes').value,
        status: 'pendente' // Padrão inicial obrigatoriamente pendente
    };

    // Insere o objeto criado no final do array global de tarefas
    tarefas.push(novaTarefa);

    // Salva os novos dados, atualiza as estatísticas superiores, redesenha a tela e limpa o formulário
    salvarNoLocalStorage();
    atualizarContadores();
    renderizarTarefas();
    form.reset(); 
});

/**
 * Função para alterar o status de uma tarefa específica utilizando o ID gerado pelo Date.now().
 * Mapeado nos botões dinâmicos usando o atributo onclick.
 */
function alternarStatus(id) {
    // Varre o array alterando apenas o item que possui o ID correspondente ao clicado
    tarefas = tarefas.map(tarefa => {
        if (tarefa.id === id) {
            tarefa.status = tarefa.status === 'pendente' ? 'concluida' : 'pendente';
        }
        return tarefa;
    });

    // Atualiza os dados persistidos e reconstrói as interfaces visuais
    salvarNoLocalStorage();
    atualizarContadores();
    renderizarTarefas();
}

/**
 * Remove em definitivo um registro específico do array baseado no ID informado.
 */
function excluirTarefa(id) {
    // Dispara uma janela de confirmação nativa do navegador para evitar exclusões acidentais
    if (confirm("Deseja realmente apagar este registro do diário?")) {
        // Filtra a lista mantendo apenas os elementos que possuem ID DIFERENTE do que desejamos deletar
        tarefas = tarefas.filter(tarefa => tarefa.id !== id);
        
        // Atualiza a memória e a tela
        salvarNoLocalStorage();
        atualizarContadores();
        renderizarTarefas();
    }
}


// =========================================================================
// 5. ESCUTADORES EM TEMPO REAL E EXECUÇÃO INICIAL
// =========================================================================

// Associa os campos de filtro à função renderizarTarefas.
// 'input' detecta cada caractere digitado imediatamente, e 'change' monitora a alteração da caixa de opções.
filtroLote.addEventListener('input', renderizarTarefas);
filtroStatus.addEventListener('change', renderizarTarefas);

// Executa essas duas funções na primeira inicialização da página (assim que o agricultor abre o site)
// garantindo que os dados salvos anteriormente carreguem de imediato.
atualizarContadores();
renderizarTarefas();