# VestBot - Guia de Uso no Windows

## 🪟 Como Iniciar no Windows

### Método Simples - Duplo Clique no .bat

1. Navegue até a pasta do VestBot
2. **Clique duas vezes** no arquivo `start-vestbot.bat`
3. Uma janela do prompt de comando abrirá
4. O script irá automaticamente:
   - ✅ Verificar e instalar dependências (se necessário)
   - ✅ Iniciar o servidor backend (porta 3001)
   - ✅ Iniciar o frontend Angular (porta 3000)
   - ✅ Aguardar ambos estarem prontos
   - ✅ Abrir o navegador automaticamente

### O que você verá no prompt

```
========================================
   🚀 Iniciando VestBot...
========================================

🔧 Iniciando backend server...

🔧 Iniciando frontend...

⏳ Aguardando backend iniciar (porta 3001)...
✅ Backend pronto!

⏳ Aguardando frontend iniciar (porta 3000)...
✅ Frontend pronto!

🌐 Abrindo navegador...

========================================
   ✨ VestBot está rodando!
   📍 Frontend: http://localhost:3000
   📍 Backend:  http://localhost:3001
========================================

Pressione qualquer tecla para encerrar os servidores...
```

### ⚠️ Importante

- **NÃO FECHE** a janela do prompt enquanto estiver usando o VestBot
- Para encerrar: **Pressione qualquer tecla** na janela do prompt
- Isso encerrará tanto o backend quanto o frontend de forma segura

---

## 🔧 Requisitos

Certifique-se de ter instalado:

- ✅ **Node.js** (versão 16 ou superior)
  - Download: https://nodejs.org/
  
- ✅ **curl** (geralmente já vem com Windows 10/11)
  - Para verificar: abra cmd e digite `curl --version`

---

## 🐛 Solução de Problemas no Windows

### 1. "curl não é reconhecido"

Se você receber este erro, instale o curl:

**Opção A - Via Chocolatey:**
```cmd
choco install curl
```

**Opção B - Via winget:**
```cmd
winget install curl.curl
```

**Opção C - Atualizar Windows:**
- Windows 10 versão 1803+ e Windows 11 já incluem curl
- Verifique se seu Windows está atualizado

### 2. "node não é reconhecido"

Instale o Node.js:
1. Baixe em https://nodejs.org/
2. Execute o instalador
3. Reinicie o prompt de comando
4. Tente novamente

### 3. Porta já em uso

Se ver erro "porta 3000 ou 3001 já está em uso":

```cmd
REM Listar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :3001

REM Encerrar processo por PID (substitua XXXX pelo PID)
taskkill /PID XXXX /F
```

### 4. Permissões

Se tiver problemas de permissão:
1. Clique com botão direito em `start-vestbot.bat`
2. Selecione "Executar como administrador"

### 5. Antivírus bloqueando

Alguns antivírus podem bloquear Node.js:
- Adicione exceção para a pasta do projeto
- Adicione exceção para Node.js

---

## 📊 Verificando se Está Funcionando

### Teste do Backend

Abra outro prompt de comando e execute:

```cmd
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "message": "VestBot Backend is running",
  "dataFile": "C:\\caminho\\para\\data\\data-user.txt"
}
```

### Teste do Frontend

Abra o navegador e acesse:
```
http://localhost:3000
```

Você deve ver a interface do VestBot.

### Verificar Arquivo de Dados

Navegue até a pasta `data` do projeto e abra `data-user.txt`:
- Arquivo deve existir
- Deve conter JSON válido
- Deve ter estrutura com stats, questionHistory e schedule

---

## 🎯 Fluxo de Uso

1. **Duplo clique** em `start-vestbot.bat`
2. **Aguarde** a mensagem "VestBot está rodando!"
3. **Navegador abre** automaticamente
4. **Use o VestBot** normalmente
5. **Seus dados são salvos** automaticamente em `data/data-user.txt`
6. Para **encerrar**: volte ao prompt e pressione qualquer tecla

---

## 💾 Backup dos Dados

Seus dados estão em:
```
VestBot/data/data-user.txt
```

Para fazer backup:
1. Copie o arquivo `data-user.txt`
2. Cole em local seguro
3. Para restaurar: substitua o arquivo

Ou use o endpoint de backup:
```
http://localhost:3001/api/user-data/backup
```

---

## 🚀 Modo Desenvolvimento (Opcional)

Se você é desenvolvedor e quer rodar manualmente:

### Terminal 1 - Backend
```cmd
npm run server
```

### Terminal 2 - Frontend
```cmd
npm run dev
```

### Ou ambos ao mesmo tempo
```cmd
npm run dev:full
```

---

## 📝 Notas Adicionais

- ✅ O script instala dependências automaticamente na primeira execução
- ✅ Usa `--legacy-peer-deps` para evitar conflitos de dependências
- ✅ Backend cria o arquivo `data-user.txt` automaticamente
- ✅ Migra dados do localStorage automaticamente
- ✅ Auto-save com debounce de 1 segundo

---

## 🆘 Suporte

Se continuar com problemas:

1. Verifique os logs no prompt de comando
2. Verifique o console do navegador (F12)
3. Verifique se as portas 3000 e 3001 estão livres
4. Tente reinstalar dependências:
   ```cmd
   rmdir /s /q node_modules
   npm install --legacy-peer-deps
   ```
