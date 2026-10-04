# 🚩 fileSend

> **Automação da montagem de comandos para transferência e exfiltração de arquivos durante pentests.**

![Status](https://img.shields.io/badge/status-beta-orange)
![Versão](https://img.shields.io/badge/versão-0.1.0--beta-blue)
![Licença](https://img.shields.io/badge/licença-GPL--3.0-blue)
![Plataformas](https://img.shields.io/badge/alvos-Linux%20%7C%20Windows-informational)

Durante um pentest, precisamos constantemente **enviar arquivos** para a máquina alvo (binários, scripts, exploits) e **exfiltrar dados** de interesse. Montar esses comandos repetidamente  muitas vezes de cabeça, no meio de uma sessão  consome tempo precioso e aumenta a chance de erro.

O **fileSend** automatiza essa montagem: você preenche os dados uma única vez (IP, porta, caminho do arquivo, destino) e os comandos prontos aparecem organizados para **copiar e colar direto na shell do alvo**.

Suporte a alvos **Linux** e **Windows**, com múltiplos métodos de transferência e exfiltração.

> ⚠️ **Versão beta (v0.1.0)**  pode conter erros ou comandos incompletos. **Teste em ambiente controlado antes de usar em campo.** Veja os [erros conhecidos](#-status-do-projeto).

---

## ✨ Funcionalidades

- 🐧 **Envio para Linux**  Python HTTP + wget/curl, Python puro, Netcat push, SCP via SSH
- 🪟 **Envio para Windows**  PowerShell (iwr / WebClient), SMB via Impacket, certutil, bitsadmin
- 📤 **Exfiltração**  Netcat, HTTP POST (uploadserver), Base64, SMB share  separada por Linux/Windows
- 🎯 **Separação visual** entre bloco **🖥 ATACANTE** e **🎯 ALVO** em cada método
- 📋 **Botão de copiar** individual em cada comando
- ⚡ **Preenchimento de exemplo** com um clique
- 🌙 **Tema claro/escuro**
- 📄 **Exportar todos os comandos em PDF**
- 🧭 **Instruções de ordem de execução** ("rode o listener primeiro") embutidas nos cards

---

## 🚀 Como usar

### Executando localmente

O fileSend é uma **página estática**  não precisa instalar nada:

```bash
git clone https://github.com/mclohrk/filesend.git
cd filesend
# abra index.html no navegador (ou sirva com python3 -m http.server 8000)
```

### Fluxo em campo

1. **Preencha os campos** no topo da página:
   - Seu IP (atacante) · IP do alvo · Porta HTTP · Caminho completo do arquivo
   - Destino Linux / Windows · Usuário e porta SSH (se aplicável)

2. **Escolha a aba** do sistema alvo: `🐧 Linux`, `🪟 Windows` ou `📤 Exfiltrar`.

3. **Selecione o método** mais adequado ao cenário.

4. **Copie e cole** os comandos:
   - Bloco **🖥 ATACANTE** → rode na sua máquina
   - Bloco **🎯 ALVO** → cole na shell do servidor comprometido

5. Use **⬇ Exportar PDF** para salvar todos os comandos gerados.

> 💡 Dica: clique em **⚡ Preencher exemplo** para ver a ferramenta funcionar antes de usar em campo.

---

## 🧰 Métodos suportados

### 🐧 Linux  Envio

| # | Método | Quando usar |
|---|--------|-------------|
| 1 | Python HTTP Server + `wget` / `curl` | Cenário padrão  presentes em 99% dos Linux |
| 2 | Python HTTP Server + `python3` puro | Alvo sem wget/curl, mas com Python |
| 3 | Netcat (push direto) | Sem HTTP  alvo escuta primeiro, atacante envia |
| 4 | SCP via SSH | Você tem credencial ou chave SSH no alvo |

### 🪟 Windows  Envio

| # | Método | Quando usar |
|---|--------|-------------|
| 1 | Python HTTP + PowerShell (`iwr` / `Net.WebClient`) | Acesso PowerShell, Windows 7+ |
| 2 | SMB via Impacket | Mais furtivo  Windows acessa SMB nativamente |
| 3 | Python HTTP + `certutil` | Apenas CMD disponível (limpar cache depois) |
| 4 | Python HTTP + `bitsadmin` | Download em background (pode ser bloqueado por GPO) |

### 📤 Exfiltração

**🐧 Linux:**
| # | Método | Quando usar |
|---|--------|-------------|
| 1 | Netcat (alvo → atacante) | Mais simples  listener no atacante primeiro |
| 2 | `curl POST` com `uploadserver` | Rota HTTP disponível no alvo |
| 3 | Base64 (encode no alvo, decode no atacante) | Sem rota de rede direta, só shell reversa |
| 4 | SMB share via Impacket | Protocolo nativo, sem instalar nada no alvo |

**🪟 Windows:**
| # | Método | Quando usar |
|---|--------|-------------|
| 1 | SMB `copy` para share do atacante | Mais simples e furtivo |
| 2 | `Invoke-WebRequest -Method POST` | PowerShell disponível |
| 3 | `certutil` base64 encode | Apenas CMD disponível |
| 4 | Netcat (`nc.exe` no alvo) | Envie o nc.exe primeiro pelo fileSend |

> ⚠️ **Métodos de exfiltração via Base64 exigem atenção:** a saída aparece na tela  copie-a manualmente para o atacante e decodifique lá.

---

## 📂 Estrutura do projeto

```
filesend/
├── index.html          # página principal (toda a interface)
├── filesend-style.css  # estilos, tema claro/escuro
├── filesend-app.js     # lógica: geração de comandos, cópia, PDF
├── README.md
├── CONTRIBUTING.md     # guia de contribuição detalhado
└── LICENSE             # GPL-3.0
```

---

## 🗺️ Status do projeto

### ✅ O que já está estável

| Aspecto | Status |
|---------|--------|
| Geração de comandos para cenários padrão | ✅ Testado manualmente |
| Interface, abas, cópia para clipboard | ✅ Funcional |
| Exportação em PDF | ✅ Funcional |
| Tema claro/escuro | ✅ Funcional |

### 🐛 Erros conhecidos e limitações

| # | Problema | Impacto | Status |
|---|----------|---------|--------|
| 1 | Comandos não testados em todas as distros (Ubuntu vs. Arch/CentOS) | Comando pode não rodar como esperado | 🚧 em aberto |
| 2 | Variações de `nc` (`ncat`, `nc.openbsd`, `nc.traditional`)  flags `-e`, `-lvnp` podem variar | Comando pode falhar | 🚧 em aberto |
| 3 | `iwr` pode não existir em Windows antigo (7) | Fallback para `Net.WebClient` necessário | 🚧 em aberto |
| 4 | `certutil` deixa rastro em cache, sem limpeza automática | Opsec reduzida | 🚧 em aberto |
| 5 | `bitsadmin` descontinuado nas versões recentes do Windows | Método pode falhar silenciosamente | 🚧 em aberto |
| 6 | Caminhos Windows com espaços ou acentos podem quebrar | Comando inválido | 🚧 em aberto |
| 7 | **Validação assimétrica**  campos de envio são validados (IP, IP do alvo, arquivo), mas os de exfiltração não: caem em placeholders silenciosos (`SEU_IP`, `/caminho/arquivo`) | Comando de exfil gerado com valor fictício sem aviso | 🚧 em aberto |
| 9 | **Colisão de porta**  exfil via Netcat e via `uploadserver` usam a mesma `inp-port` do HTTP de envio | Conflito se o `http.server` estiver ativo na mesma porta | 🚧 em aberto |
| 10 | **Porta do Netcat de envio fixa em 9000**, não configurável pela interface | Pouco flexível em cenários com firewall/segmentação | 🚧 em aberto |
| 8 | Sem testes automatizados | Regressões passam despercebidas | 🚧 em aberto |

> 💡 **Encontrou um erro que não está na lista?** [Abra uma issue](https://github.com/mclohrk/filesend/issues) com o cenário (SO alvo, versão, método), o comando gerado, a saída esperada vs. obtida, e prints/logs se possível.


### 🔧 Por que JavaScript? (decisão técnica)

O fileSend é uma **página 100% estática**  sem backend, sem servidor, sem banco de dados. Todo o processamento (montagem dos comandos, cópia, exportação em PDF) acontece **no navegador do usuário**, via JavaScript puro. Nenhum dado preenchido (IPs, caminhos de arquivo) sai da máquina ou é enviado para lugar nenhum.

**Por que essa escolha importa em pentest:**

| Vantagem | Motivo |
|----------|--------|
| 🕵️ **Opsec do próprio pentester** | IPs internos e caminhos de arquivo nunca trafegam por serviço de terceiros |
| ⚡ **Zero instalação** | funciona offline após o primeiro carregamento, direto do arquivo local |
| 🧳 **Portátil** | pode ser levado em pendrive, aberto em qualquer máquina, inclusive isolada |
| 🔒 **Sem telemetria** | não há analytics, logs de servidor ou coleta de dados |

### ⚠️ Limitações dessa abordagem

| # | Limitação | Impacto | Workaround |
|---|-----------|---------|------------|
| 1 | **Requer JavaScript habilitado no navegador** | Em navegadores com JS bloqueado (hardening extremo), a página não gera comandos | Abrir em outro navegador/perfil; a página funciona 100% offline |
| 2 | **Sem persistência dos campos** | Ao fechar a aba, os campos se perdem  o `localStorage` é usado apenas para o tema | Exportar PDF antes de fechar; preencher de novo é rápido |
| 3 | **Roda só no navegador** | Sem integração com terminal, clipboard do sistema ou automação externa | Roadmap: versão CLI |
| 4 | **Não detecta o ambiente do alvo** | A ferramenta não sabe qual distro/versão do alvo  a escolha do método é manual | Conhecer o alvo via enumeração antes de escolher o método |
| 5 | **PDF via `window.print()`** | Depende do diálogo de impressão do navegador; layout varia entre navegadores | Testar no navegador que você usa em campo. A página expande todos os painéis antes de imprimir para capturar todos os métodos |
| 6 | **Sem versionamento de comandos gerados** | Comandos antigos não ficam salvos para comparar | O PDF exportado serve de registro |

### Roadmap pós-beta

- [ ] Validação em múltiplas distros (Ubuntu, Debian, Arch, CentOS)
- [ ] Validação em Windows 10 / 11 / Server 2019+
- [ ] Validação dos campos de exfiltração (bloquear placeholders silenciosos)
- [ ] Porta do Netcat configurável (hoje fixa em 9000 no envio)
- [ ] Porta separada para exfiltração (evitar colisão com o HTTP de envio)
- [ ] Novos métodos (DNS exfil, ICMP, HTTPS)
- [ ] Suporte a macOS e BSD como alvo
- [ ] Internacionalização (EN/ES)
- [ ] Versão CLI (`filesend --target linux --method wget ...`)

---

## 🤝 Contribuindo

Cada pentester tem seu jeito, seu arsenal, seus truques  e é isso que faz a comunidade ser rica. Se você conhece um método melhor, mais furtivo, mais rápido ou mais confiável do que os que estão aqui, **compartilhe**: uma variação de comando, um one-liner que você usa há anos, ou uma técnica totalmente diferente (DNS exfil, ICMP, HTTPS, o que for).

Não precisa saber programar para contribuir  só o comando já ajuda. A gente adapta para a interface.

📖 Veja o guia completo em [CONTRIBUTING.md](CONTRIBUTING.md)  como reportar bugs, propor métodos (`[MÉTODO]`), fluxo de fork/PR e prioridades durante o beta.

**Resumo rápido:**

| Tipo | Exemplo |
|------|---------|
| 🐛 Reportar bugs | "O comando X não funciona no CentOS 8 porque..." |
| 🔧 Novos métodos | DNS exfil, ICMP tunneling, HTTPS POST |
| 📝 Melhorar comandos | Variações mais curtas, com fallback |
| 🧪 Testar em outros SOs | Rodar os comandos e reportar resultados |

> ⚖️ Ao contribuir, você concorda que suas contribuições serão licenciadas sob a **GPL-3.0**.

---

## 📜 Licença

Distribuído sob a licença **GPL-3.0**. Veja [LICENSE](LICENSE) para mais detalhes.

---

**🚩 mclohrk** · [mclohrk.xyz](https://mclohrk.xyz) · [github.com/mclohrk/filesend](https://github.com/mclohrk/filesend)
