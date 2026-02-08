# VestBot - Sistema de Simulados ETEC (Modo Offline)

## 📋 Visão Geral

O VestBot agora funciona **completamente offline**, carregando questões dos arquivos JSON locais na pasta `questions/`. Não é mais necessário ter uma chave da API Gemini para usar os simulados.

## ✨ Funcionalidades Offline

### ✅ Funcionam Offline
- **Simulados completos** com questões dos arquivos locais
- **Filtros por matéria** e dificuldade
- **Cronômetro** e estatísticas
- **Explicações** das questões (quando disponíveis nos arquivos)
- **Sistema de gamificação** (XP, níveis, streak)

### ⚠️ Requerem Internet
- Geração de questões via IA (desabilitado - usa apenas questões locais)
- Chat com tutor IA
- Correção de redações
- Geração de atividades de interpretação

## 📁 Arquivos de Questões

O sistema carrega automaticamente as questões dos seguintes arquivos:

| Arquivo | Descrição | Questões |
|---------|-----------|----------|
| `ciencias-quest.txt` | Questões de Ciências (Biologia, Física, Química) | ~150 |
| `matematica-quest.txt` | Questões de Matemática | ~60 |
| `historia-quest.txt` | Questões de História | ~80 |
| `grande-quest.txt` | Questões Gerais | ~70 |
| `variadas-quest.txt` | Questões Variadas 1 | ~85 |
| `variadas-quest-2.txt` | Questões Variadas 2 | ~150 |

**Total: ~600+ questões disponíveis offline!**

## 🚀 Como Usar

### 1. Instalação

```bash
cd VestBot
npm install --legacy-peer-deps
```

### 2. Executar Localmente

#### 🐧 Linux / 🍎 macOS

```bash
npm run dev
```

O aplicativo abrirá em `http://localhost:4200`

#### 🪟 Windows

**Método Simples (Recomendado):**

1. Dê **duplo clique** em `start-vestbot.bat`
2. Aguarde o script:
   - ✅ Instalar dependências (primeira vez)
   - ✅ Iniciar backend (porta 3001)
   - ✅ Iniciar frontend (porta 3000)
   - ✅ Abrir navegador automaticamente
3. Use o VestBot! 🎓

**⚠️ Windows Security bloqueando?**
- Veja [WINDOWS_SECURITY.md](WINDOWS_SECURITY.md) para adicionar exceção
- Leia [LEIA-ME-SEGURANCA.txt](LEIA-ME-SEGURANCA.txt) para entender por que é seguro
- O VestBot é 100% seguro e open source!

**Documentação Completa para Windows:**
- [WINDOWS_GUIDE.md](WINDOWS_GUIDE.md) - Guia de uso completo
- [WINDOWS_SECURITY.md](WINDOWS_SECURITY.md) - Como adicionar exceção no antivírus
- [CHANGELOG_SEGURANCA.md](CHANGELOG_SEGURANCA.md) - Detalhes das melhorias de segurança

### 3. Usar Simulados Offline

1. Acesse a seção **"Simulado"** no menu lateral
2. As questões serão carregadas automaticamente dos arquivos locais
3. Configure seu simulado:
   - Selecione as matérias desejadas
   - Escolha a quantidade de questões (até 600+)
   - Defina a dificuldade (Fácil, Médio, Difícil ou Mista)
   - Configure o tempo (padrão: 4 horas)
4. Clique em **"Iniciar Simulado"**
5. Responda as questões e veja seu desempenho!

## 🔧 Formato dos Arquivos de Questões

Os arquivos na pasta `questions/` seguem este formato JSON:

```json
[
  {
    "id": 1,
    "materia": "Biologia",
    "dificuldade": "Fácil",
    "enunciado": "Texto da questão...",
    "alternativas": [
      "Opção A",
      "Opção B",
      "Opção C",
      "Opção D",
      "Opção E"
    ],
    "correta": "Opção C",
    "explicacao_base": "Explicação da resposta correta..."
  }
]
```

### Adicionar Novas Questões

1. Edite qualquer arquivo `.txt` na pasta `questions/`
2. Adicione novas questões seguindo o formato acima
3. Recarregue a página - as questões serão carregadas automaticamente

## 📊 Estatísticas e Gamificação

O sistema mantém suas estatísticas localmente:
- **XP**: Ganhe 50 XP por resposta correta, 10 XP por tentativa
- **Níveis**: Suba de nível a cada 1000 XP
- **Streak**: Mantenha uma sequência de acertos
- **Histórico**: Acompanhe questões respondidas e taxa de acerto

## 🌐 Modo Online (Opcional)

Para usar funcionalidades de IA (chat, correção de redações):

1. Obtenha uma chave da API Gemini em https://ai.google.dev/
2. Adicione no arquivo `.env.local`:
   ```
   API_KEY=sua_chave_aqui
   ```
3. Reinicie o servidor

## 🛠️ Arquitetura Técnica

### Serviços Principais

- **QuestionLoaderService**: Carrega e converte questões dos arquivos JSON
- **ContentService**: Gerencia questões, estatísticas e cronograma
- **GeminiService**: Funcionalidades de IA (opcional, com fallback offline)

### Fluxo de Carregamento

1. App inicia → `QuizComponent` carrega questões
2. `ContentService.loadQuestionsFromFiles()` é chamado
3. `QuestionLoaderService` faz fetch dos arquivos JSON
4. Questões são convertidas para o formato interno
5. Cache é mantido em memória para performance

## 🐛 Solução de Problemas

### Questões não carregam
- Verifique se os arquivos estão em `/questions/`
- Abra o console do navegador (F12) para ver erros
- Certifique-se de que os arquivos são JSON válido

### Erro ao iniciar simulado
- Verifique se selecionou pelo menos uma matéria
- Tente reduzir a quantidade de questões
- Limpe o cache do navegador

### Performance lenta
- O carregamento inicial pode levar alguns segundos
- Após o primeiro carregamento, as questões ficam em cache
- Considere reduzir o número de questões no simulado

## 📝 Notas Importantes

- ✅ **100% offline** para simulados
- ✅ Não requer API key para funcionalidade básica
- ✅ Questões carregadas automaticamente
- ✅ Explicações incluídas quando disponíveis
- ⚠️ Funcionalidades de IA requerem internet e API key

## 🤝 Contribuindo

Para adicionar mais questões:
1. Edite os arquivos em `questions/`
2. Siga o formato JSON especificado
3. Teste localmente antes de compartilhar

## 📄 Licença

Este projeto é para fins educacionais.
