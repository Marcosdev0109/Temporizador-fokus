# Fokus 2.0: Pomodoro com tarefas e progresso

Temporizador no método Pomodoro, feito em HTML, CSS e JavaScript puros, que dá para instalar no celular como app.

**Demo:** https://marcosdev0109.github.io/Temporizador-fokus/

## Funcionalidades

- **Três modos:** foco (25 min), descanso curto (5 min) e descanso longo (15 min), cada um com cor, imagem e frase próprias.
- **Tarefas do dia:** adicione, conclua e exclua tarefas. A tarefa escolhida recebe os minutos de cada sessão de foco.
- **Progresso:** sessões e minutos de hoje, dias seguidos de foco e um gráfico com os últimos 7 dias.
- **Ciclo automático:** ao terminar o foco, sugere o descanso; a cada 4 sessões, o descanso longo.
- **Tempo preciso:** a contagem usa o horário de término, então não atrasa com a aba em segundo plano.
- **Instalável (PWA):** manifesto e service worker para instalar no celular e abrir sem internet.
- **Acessível:** barra de espaço inicia e pausa, aviso na tela no lugar do `alert`, foco visível no teclado.
- Música de fundo e sons de início, pausa e fim.

Os dados ficam só no navegador (localStorage).

## Tecnologias

HTML, CSS, JavaScript (DOM, Audio, localStorage, Notification API, Service Worker), GitHub Pages.

## Créditos

Base visual do curso de JavaScript da Alura, com imagens geradas por IA no Adobe Firefly. Versão 2.0 (tarefas, histórico, gráfico, PWA e correções) por João Marcos Rodrigues Barbosa · [Portfólio](https://marcosdev0109.github.io)
