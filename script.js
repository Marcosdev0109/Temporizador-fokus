// Fokus 2.0: temporizador Pomodoro com tarefas, histórico de sessões e gráfico da semana.
// Os dados ficam no navegador (localStorage). Nada é enviado para servidor.

const html = document.querySelector('html')
const focoBt = document.querySelector('.app__card-button--foco')
const curtoBt = document.querySelector('.app__card-button--curto')
const longoBt = document.querySelector('.app__card-button--longo')
const banner = document.querySelector('.app__image')
const titulo = document.querySelector('.app__title')
const botoes = document.querySelectorAll('.app__card-button')
const startPauseBt = document.querySelector('#start-pause')
const musicaFocoInput = document.querySelector('#alternar-musica')
const iniciarOuPausarBt = document.querySelector('#start-pause span')
const imagemPausa = document.querySelector('.app__card-primary-butto-icon')
const tempoNaTela = document.querySelector('#timer')

const musica = new Audio('./sons/luna-rise-part-one.mp3')
const audioPlay = new Audio('./sons/play.wav')
const audioPausa = new Audio('./sons/pause.mp3')
const audioTempoFinalizado = new Audio('./sons/beep.mp3')
musica.loop = true

const DURACOES = { 'foco': 1500, 'descanso-curto': 300, 'descanso-longo': 900 }
const TITULOS = {
    'foco': 'Otimize sua produtividade,<br><strong class="app__title-strong">mergulhe no que importa.</strong>',
    'descanso-curto': 'Que tal dar uma respirada? <strong class="app__title-strong">Faça uma pausa curta!</strong>',
    'descanso-longo': 'Hora de voltar à superfície. <strong class="app__title-strong">Faça uma pausa longa.</strong>'
}
const BOTAO = { 'foco': focoBt, 'descanso-curto': curtoBt, 'descanso-longo': longoBt }

let contexto = 'foco'
let restante = DURACOES.foco      // segundos que faltam
let fimEm = null                  // horário (ms) em que o ciclo termina; null = pausado
let intervaloId = null

/* ---------- armazenamento ---------- */
const guardado = {
    ler(chave, padrao) { try { return JSON.parse(localStorage.getItem(chave)) ?? padrao } catch { return padrao } },
    salvar(chave, valor) { try { localStorage.setItem(chave, JSON.stringify(valor)) } catch { /* modo privado */ } }
}
let tarefas = guardado.ler('fokus:tarefas', [])
let sessoes = guardado.ler('fokus:sessoes', [])   // { data: 'AAAA-MM-DD', minutos, tarefaId }
let tarefaAtivaId = guardado.ler('fokus:ativa', null)

/* ---------- temporizador ---------- */
function alterarContexto(novo) {
    if (intervaloId) pausar(false)
    contexto = novo
    restante = DURACOES[novo]
    html.setAttribute('data-contexto', novo)
    banner.setAttribute('src', `./imagens/${novo}.png`)
    titulo.innerHTML = TITULOS[novo]
    botoes.forEach(b => b.classList.remove('active'))
    BOTAO[novo].classList.add('active')
    mostrarTempo()
}

focoBt.addEventListener('click', () => alterarContexto('foco'))
curtoBt.addEventListener('click', () => alterarContexto('descanso-curto'))
longoBt.addEventListener('click', () => alterarContexto('descanso-longo'))

function iniciar() {
    audioPlay.play().catch(() => {})
    fimEm = Date.now() + restante * 1000
    intervaloId = setInterval(tick, 250)
    iniciarOuPausarBt.textContent = 'Pausar'
    imagemPausa.src = './imagens/pause.png'
}

function pausar(comSom = true) {
    if (comSom) audioPausa.play().catch(() => {})
    clearInterval(intervaloId)
    intervaloId = null
    fimEm = null
    iniciarOuPausarBt.textContent = 'Começar'
    imagemPausa.src = './imagens/play_arrow.png'
}

function iniciarOuPausar() { intervaloId ? pausar() : iniciar() }
startPauseBt.addEventListener('click', iniciarOuPausar)

// Usa o horário de término em vez de contar segundos: o tempo fica certo mesmo com a aba em segundo plano.
function tick() {
    restante = Math.max(0, Math.round((fimEm - Date.now()) / 1000))
    mostrarTempo()
    if (restante <= 0) terminarCiclo()
}

function terminarCiclo() {
    pausar(false)
    audioTempoFinalizado.play().catch(() => {})
    if (contexto === 'foco') {
        registrarSessao(DURACOES.foco / 60)
        const hoje = sessoes.filter(s => s.data === hojeISO()).length
        const proximo = hoje % 4 === 0 ? 'descanso-longo' : 'descanso-curto'
        avisar(`Sessão de foco concluída! ${hoje} hoje. Hora do ${proximo === 'descanso-longo' ? 'descanso longo' : 'descanso curto'}.`)
        alterarContexto(proximo)
    } else {
        avisar('Fim do descanso. Bora focar de novo?')
        alterarContexto('foco')
    }
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Fokus', { body: contexto === 'foco' ? 'Hora de focar.' : 'Hora de descansar.' })
    }
}

function mostrarTempo() {
    const m = String(Math.floor(restante / 60)).padStart(2, '0')
    const s = String(restante % 60).padStart(2, '0')
    tempoNaTela.textContent = `${m}:${s}`
    document.title = intervaloId ? `${m}:${s} · Fokus` : 'Fokus'
}

musicaFocoInput.addEventListener('change', () => {
    musica.paused ? musica.play().catch(() => {}) : musica.pause()
})

// Barra de espaço inicia ou pausa (fora dos campos de texto)
document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !e.target.closest('input, textarea, button')) { e.preventDefault(); iniciarOuPausar() }
})

/* ---------- tarefas ---------- */
const formTarefa = document.querySelector('#form-tarefa')
const inputTarefa = document.querySelector('#nova-tarefa')
const listaTarefas = document.querySelector('#lista-tarefas')

formTarefa.addEventListener('submit', e => {
    e.preventDefault()
    const nome = inputTarefa.value.trim()
    if (!nome) { inputTarefa.focus(); return }
    const nova = { id: Date.now(), nome, feita: false, minutos: 0 }
    tarefas.push(nova)
    if (!tarefaAtivaId) tarefaAtivaId = nova.id
    inputTarefa.value = ''
    salvarTudo()
})

listaTarefas.addEventListener('click', e => {
    const li = e.target.closest('.tarefa'); if (!li) return
    const id = Number(li.dataset.id)
    const t = tarefas.find(x => x.id === id)
    if (e.target.closest('.tarefa__x')) {
        tarefas = tarefas.filter(x => x.id !== id)
        if (tarefaAtivaId === id) tarefaAtivaId = null
    } else if (e.target.closest('.tarefa__check')) {
        t.feita = e.target.checked
        if (t.feita && tarefaAtivaId === id) tarefaAtivaId = null
    } else if (e.target.closest('.tarefa__nome')) {
        tarefaAtivaId = tarefaAtivaId === id ? null : id
    }
    salvarTudo()
})

function renderTarefas() {
    if (!tarefas.length) {
        listaTarefas.innerHTML = '<li class="vazio">Nenhuma tarefa ainda. Adicione a primeira acima.</li>'
        return
    }
    listaTarefas.innerHTML = tarefas.map(t => `
        <li class="tarefa${t.id === tarefaAtivaId ? ' ativa' : ''}${t.feita ? ' feita' : ''}" data-id="${t.id}">
            <input class="tarefa__check" type="checkbox" ${t.feita ? 'checked' : ''} aria-label="Concluir ${escapar(t.nome)}">
            <button class="tarefa__nome" type="button" aria-pressed="${t.id === tarefaAtivaId}">${escapar(t.nome)}</button>
            <span class="tarefa__tempo">${t.minutos} min</span>
            <button class="tarefa__x" type="button" aria-label="Excluir ${escapar(t.nome)}">×</button>
        </li>`).join('')
}

function escapar(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/* ---------- histórico e gráfico ---------- */
function hojeISO(d = new Date()) { return d.toLocaleDateString('sv-SE') }

function registrarSessao(minutos) {
    sessoes.push({ data: hojeISO(), minutos, tarefaId: tarefaAtivaId })
    const t = tarefas.find(x => x.id === tarefaAtivaId)
    if (t) t.minutos += minutos
    salvarTudo()
}

function sequencia() {
    const dias = new Set(sessoes.map(s => s.data))
    let n = 0, d = new Date()
    if (!dias.has(hojeISO(d))) d.setDate(d.getDate() - 1)   // hoje ainda sem sessão não quebra a sequência
    while (dias.has(hojeISO(d))) { n++; d.setDate(d.getDate() - 1) }
    return n
}

function renderProgresso() {
    const hoje = sessoes.filter(s => s.data === hojeISO())
    const minHoje = hoje.reduce((a, s) => a + s.minutos, 0)
    const seq = sequencia()
    document.querySelector('#numeros').innerHTML = `
        <div><b>${hoje.length}</b><span>${hoje.length === 1 ? 'sessão hoje' : 'sessões hoje'}</span></div>
        <div><b>${minHoje}</b><span>minutos de foco hoje</span></div>
        <div><b>${seq}</b><span>${seq === 1 ? 'dia seguido' : 'dias seguidos'}</span></div>`

    const dias = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const iso = hojeISO(d)
        dias.push({ iso, nome: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''), min: sessoes.filter(s => s.data === iso).reduce((a, s) => a + s.minutos, 0) })
    }
    const max = Math.max(25, ...dias.map(d => d.min))
    document.querySelector('#semana').innerHTML = dias.map((d, i) => `
        <div class="dia${i === 6 ? ' hoje' : ''}">
            <span class="dia__valor">${d.min}</span>
            <span class="dia__barra" style="height:${Math.round(d.min / max * 100)}%"></span>
            <span class="dia__nome">${i === 6 ? 'hoje' : d.nome}</span>
        </div>`).join('')
}

function salvarTudo() {
    guardado.salvar('fokus:tarefas', tarefas)
    guardado.salvar('fokus:sessoes', sessoes)
    guardado.salvar('fokus:ativa', tarefaAtivaId)
    renderTarefas()
    renderProgresso()
}

/* ---------- aviso na tela (substitui o alert) ---------- */
const aviso = document.querySelector('#aviso')
let avisoTimer = null
function avisar(texto) {
    aviso.textContent = texto
    aviso.hidden = false
    clearTimeout(avisoTimer)
    avisoTimer = setTimeout(() => { aviso.hidden = true }, 5000)
}

/* ---------- instalar como app (PWA) ---------- */
let pedidoInstalacao = null
const instalarBt = document.querySelector('#instalar')
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pedidoInstalacao = e; instalarBt.hidden = false })
instalarBt.addEventListener('click', async () => {
    if (!pedidoInstalacao) return
    pedidoInstalacao.prompt()
    await pedidoInstalacao.userChoice
    pedidoInstalacao = null
    instalarBt.hidden = true
})
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {})

// Pede permissão de notificação no primeiro início, para avisar quando o ciclo acabar com a aba em segundo plano
startPauseBt.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
}, { once: true })

mostrarTempo()
salvarTudo()
