# 🥚 TikEgg Overlay

Overlay profissional de ovo animado para streams TikTok com integração Streamer.bot via WebSocket.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Recursos

| Recurso | Descricao |
|---------|-----------|
| 🥚 Ovo animado | Muda visual conforme progresso (0%, 25%, 50%, 75%, 100%) |
| 📊 Barra de progresso | Animada com shimmer e gradiente |
| 🎁 Gift popup | Mostra nome do gift, usuario e valor |
| ✨ Shake do ovo | Tremor proporcional ao valor do gift |
| 💥 Hatching | Animacao de eclosao ao atingir 100% |
| 🐣 Animais aleatorios | Sistema de raridade (Common → Legendary) |
| 🎉 Confetes | Efeitos de particulas por raridade |
| 🔊 Sons | Gift, hatch e legendary |
| 📜 Historico | Ultimos 5 gifts recebidos |
| 📈 Estatisticas | Total gifts, hatched, top gifter |
| 🔄 Auto-reset | Reinicia automaticamente apos eclosao |
| 🖥️ Fundo transparente | Perfeito para OBS Browser Source |
| 📱 Responsivo | Adapta a qualquer resolucao |
| ⚡ 60 FPS | Animacoes suaves com requestAnimationFrame |

---

## 🏗️ Estrutura do Projeto

```
TikEgg/
├── index.html          # Overlay principal
├── style.css           # Estilos e animacoes
├── script.js           # Logica do jogo
├── websocket.js        # Conexao WebSocket
├── confetti.js         # Motor de confetes/particulas
├── server.js           # Servidor Node.js (relay)
├── package.json        # Dependencias
├── README.md           # Este arquivo
│
├── assets/
│   ├── eggs/           # SVGs do ovo (5 estados)
│   │   ├── egg0.svg
│   │   ├── egg25.svg
│   │   ├── egg50.svg
│   │   ├── egg75.svg
│   │   └── egg100.svg
│   │
│   ├── animals/        # SVGs dos animais
│   │   ├── chick.svg
│   │   ├── duck.svg
│   │   ├── fox.svg
│   │   ├── lion.svg
│   │   ├── unicorn.svg
│   │   └── dragon.svg
│   │
│   └── sounds/         # Efeitos sonoros
│       ├── gift.mp3
│       ├── hatch.mp3
│       └── legendary.mp3
```

---

## 🚀 Instalacao

### Pre-requisitos

- [Node.js](https://nodejs.org/) v16 ou superior
- [OBS Studio](https://obsproject.com/) com Browser Source
- [Streamer.bot](https://streamer.bot/) (opcional, para integracao TikTok)

### Passos

```bash
# 1. Clone ou baixe o projeto
cd TikEgg

# 2. Instale as dependencias
npm install

# 3. Inicie o servidor
npm start
```

O servidor vai iniciar em:
- **Overlay:** http://localhost:3000
- **Painel de teste:** http://localhost:3000/test
- **WebSocket:** ws://localhost:7777

---

## 🖥️ Configuracao no OBS

1. No OBS, adicione uma nova fonte **Browser Source**
2. Configure:
   - **URL:** `http://localhost:3000/index.html`
   - **Width:** 1920 (ou a resolucao da sua stream)
   - **Height:** 1080
   - **Custom CSS:** (deixe vazio)
   - ✅ Marque "Shutdown source when not visible"
3. O fundo sera automaticamente transparente

---

## 🤖 Integracao com Streamer.bot

### Opcao 1: Via Servidor Relay (Recomendado)

O `server.js` atua como ponte entre o Streamer.bot e o overlay.

**No Streamer.bot:**

1. Crie uma nova **Action**
2. Adicione um sub-action: **Core → Network → WebSocket Client**
3. Configure:
   - **URL:** `ws://localhost:7777`
   - **Message:**

```json
{
  "user": "%user%",
  "gift": "%gift%",
  "value": %value%
}
```

### Opcao 2: Conexao Direta ao Streamer.bot

Edite o `websocket.js` e mude o modo:

```javascript
const wsConnection = new TikEggWebSocket({
    mode: 'streamerbot',
    streamerBotUrl: 'ws://localhost:8080'
});
```

### Opcao 3: REST API

Envie gifts via HTTP POST:

```bash
curl -X POST http://localhost:3000/api/gift \
  -H "Content-Type: application/json" \
  -d '{"user":"Samad Jr","gift":"Rose","value":1}'
```

---

## 🎮 Formato das Mensagens

O overlay aceita varios formatos de mensagem:

### Formato Basico (Recomendado)
```json
{
  "user": "Samad Jr",
  "gift": "Rose",
  "value": 1
}
```

### Formato Streamer.bot Event
```json
{
  "event": { "source": "TikTok", "type": "Gift" },
  "data": { "user": "Samad Jr", "gift": "Rose", "value": 5 }
}
```

### Formato Custom Action
```json
{
  "action": "gift",
  "payload": { "user": "Samad Jr", "gift": "Doughnut", "value": 10 }
}
```

### Formato TikTokLive
```json
{
  "type": "gift",
  "nickname": "Samad Jr",
  "giftName": "Rose",
  "diamondCount": 1
}
```

---

## 🎁 Valores dos Gifts

| Gift | Valor (%) | Icone |
|------|-----------|-------|
| Rose | 1 | 🌹 |
| TikTok | 1 | 🎵 |
| Heart | 1 | ❤️ |
| Ice Cream Cone | 2 | 🍦 |
| Finger Heart | 5 | 🫰 |
| GG | 5 | 🎮 |
| Doughnut | 10 | 🍩 |
| Love You | 15 | 💕 |
| Cap | 20 | 🧢 |
| Sunglasses | 25 | 😎 |
| Hand Hearts | 50 | 🙌 |
| Corgi | 100 | 🐕 |
| Galaxy | 500 | 🌌 |

> Personalize os valores em `script.js` no objeto `giftValues`.

---

## 🐣 Sistema de Raridade

| Raridade | Chance | Animais | Cor |
|----------|--------|---------|-----|
| Common | 40% | Pintinho, Patinho | Cinza |
| Uncommon | 30% | Coelhinho, Raposa | Verde |
| Rare | 18% | Leao | Azul |
| Epic | 9% | Unicornio | Roxo |
| Legendary | 3% | Dragao, Phoenix | Vermelho/Dourado |

---

## 🧪 Teste

### Painel de Teste Web

Acesse `http://localhost:3000/test` para um painel interativo com:
- Selecao de gifts
- Envio rapido com botoes
- Log de conexao em tempo real

### Teste via Console

Abra o console do navegador no overlay e digite:

```javascript
// Enviar um gift manualmente
window.TikEggGame.processGift({
    user: "Teste",
    gift: "Galaxy",
    value: 50
});
```

### Modo Demo

No `script.js`, descomente o bloco de teste no final para ativar gifts automaticos:

```javascript
setInterval(() => {
    const users = ['Samad Jr', 'Maria', 'Pedro', 'Ana', 'Lucas'];
    const gifts = ['Rose', 'Heart', 'Finger Heart', 'Doughnut', 'Galaxy'];
    game.processGift({
        user: users[Math.floor(Math.random() * users.length)],
        gift: gifts[Math.floor(Math.random() * gifts.length)],
        value: Math.floor(Math.random() * 10) + 1
    });
}, 3000);
```

---

## ⚙️ Personalizacao

### Alterar Portas

Edite as variaveis de ambiente ou o `server.js`:

```bash
HTTP_PORT=3000 WS_PORT=7777 npm start
```

### Adicionar Novos Animais

Em `script.js`, adicione ao array `this.animals`:

```javascript
{ name: 'NomeDoAnimal', file: 'arquivo.svg', rarity: 'rare', emoji: '🎯' }
```

E coloque o SVG/PNG em `assets/animals/`.

### Alterar Valores dos Gifts

Em `script.js`, edite o objeto `this.giftValues`:

```javascript
this.giftValues = {
    'Rose': 1,
    'NovoGift': 10,
    // ...
};
```

### Adicionar Sons

Substitua os arquivos em `assets/sounds/`:
- `gift.mp3` - Toca a cada gift recebido
- `hatch.mp3` - Toca quando o ovo eclode
- `legendary.mp3` - Toca para raridades Epic e Legendary

---

## 🛣️ Roadmap (Futuras Versoes)

- [ ] 🐠 Modo Aquario
- [ ] 🏙️ Modo Cidade
- [ ] 👹 Modo Boss Fight
- [ ] 🏆 Leaderboard
- [ ] 💾 Persistencia (salvar progresso)
- [ ] 🎨 Temas personalizaveis
- [ ] 🔌 Plugin system

---

## 📝 Licenca

MIT License - Use livremente em suas streams!

---

## 🤝 Creditos

Desenvolvido para a comunidade de streamers TikTok.

Feito com ❤️ e muito ☕
