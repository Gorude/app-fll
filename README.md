# 🎣 PescaMS - Guia Offline do Pescador Amador de Mato Grosso do Sul

> **Progressive Web App (PWA) 100% Funcional Offline**, desenvolvido especificamente para pescadores esportivos e amadores no estado de **Mato Grosso do Sul** (Pantanal, Bacias dos Rios Paraguai e Paraná).

Reúne mapas de rios e zonas regulamentadas, identificação de espécies por câmera/IA no aparelho, períodos de defeso (Piracema), cálculo de tamanhos permitidos e cotas oficiais, tábua solunar, condições meteorológicas, bússola de retorno ao acampamento e botão de socorro SOS com coordenadas satelitais.

---

## 🌟 Principais Recursos

### 1. 🗺️ Mapa Interativo & Navegação GPS Sem Internet
- **Camada Vetorial de Rios**: Calha navegável dos Rios Paraguai, Miranda, Aquidauana, Taquari, Apa, Paraná e Sucuriú.
- **Zonas Classificadas**:
  - 🟢 **Permitidas**: Trechos livres para pesca amadora com licença IMASUL.
  - 🔴 **Proibidas**: Santuários ecológicos (ex: Rio Salobra, Rio Formoso, Rio da Prata) e raios de segurança de barragens (ex: UHE Jupiá) e corredeiras.
  - 🟡 **Restritas**: Trechos exclusivos de *Pesque e Solte* (ex: Rio Perdido, Rio Negro).
  - ⚠️ **Áreas de Risco**: Pedrais submersos na estiagem, corredeiras violentas e balseiros de camalotes.
  - 🛶 **Rampas Públicas & Marinas**: Locais com descida de carretas e embarque seguro.
  - 🏕️ **Pontos de Apoio & Campings**: Venda de iscas vivas (tuviras), gelo e combustível ribeirinho.
  - 👮 **Postos da PMA**: Pelotões da Polícia Militar Ambiental (Corumbá, Bonito, Coxim, Miranda, Três Lagoas).
  - 🏥 **Hospitais 24h**: Prontos-socorros com soro antiofídico e antiescorpiônico.
- **Bússola de Retorno ao Ponto de Partida ("Marcar Base")**:
  - O pescador marca onde deixou o acampamento ou a carreta do barco.
  - O aplicativo calcula continuamente a **distância em metros/km** e o **rumo em graus (azimute)** via GPS do celular sem precisar de sinal de internet.

---

### 2. 📷 Câmera para Identificação de Espécies (IA Offline)
- Utiliza a câmera do smartphone ou fotos da galeria.
- **Processamento 100% no Dispositivo**: Nenhum dado ou foto é enviado para a internet.
- Calcula índice de similaridade e confiança visual (ex: Pintado 92%).
- **Veredito Legal Instantâneo**:
  - Informa se o peixe pode ser mantido ou se deve ser solto.
  - Exibe faixa de comprimento permitido (mínimo e máximo).
- **Orientações Éticas e Preservação de Matrizes**:
  - Informações de dimorfismo sexual externo quando aplicáveis.
  - **Aviso rígido de conservação**: *Nunca abra ou aperte o peixe para verificar ovas.* Preservação de fêmeas ovadas na pré-piracema.
  - Isenção de responsabilidade legal visível.

---

### 3. 📏 "Posso Levar Este Peixe?" (Calculadora Rápida & Régua Digital)
- Seleção direta da espécie + slider em centímetros.
- Resposta visual imediata:
  - 🟢 **Liberado para Transporte**: Dentro das medidas legais (respeitando a cota de 1 exemplar nativo licenciado).
  - 🔴 **Proibido - Submedida**: Abaixo do tamanho mínimo.
  - 🔴 **Proibido - Matriz Protegida**: Acima do tamanho máximo permitido.
  - 🟡 **Pesque e Solte Obrigatório**: Espécies protegidas por lei (ex: Dourado).
  - 🟢 **Espécie Exótica**: Sem limite de cota (Tucunaré, Tilápia, Corvina).

---

### 4. ⚖️ Legislação do Mato Grosso do Sul Atualizada
- **Lei do Dourado (Lei Estadual nº 6.390/2025 e Lei nº 5.321/2019)**: Proibição de abate prorrogada até **31 de março de 2027**; modalidade permitida exclusivamente: *Pesque e Solte*.
- **Cota de Transporte (Decreto Estadual nº 15.166/2019)**:
  - 1 (um) exemplar de espécie nativa dentro do intervalo legal.
  - Até 5 (cinco) piranhas.
  - Espécies exóticas: Ilimitadas.
- **Apetrechos**: Permitidos (linha de mão, vara, carretilha, molinete) vs. Proibidos (redes, tarrafas, espinhéis, covos - crime ambiental inafiançável).
- **Distâncias Legais**: Proibição a menos de 200m de corredeiras/escadas de peixe e a menos de 1.500m de barragens de hidrelétricas.
- **Licença IMASUL**: Orientações para emissão da Autorização Digital de Pesca Amadora.

---

### 5. 📅 Calendário de Defeso & Piracema
- Regras e datas da **Bacia do Rio Paraguai** (05/Nov a 28/Fev) e **Bacia do Rio Paraná** (01/Nov a 28/Fev).
- Contagem regressiva de dias restantes para o início ou fim da Piracema.
- Calendário mensal interativo com marcação dos dias abertos e fechados.

---

### 6. 🌙 Fases da Lua, Teoria Solunar & Clima
- **Cálculo Astronômico Autônomo**:
  - Algoritmo NOAA para nascer, meio-dia solar e pôr do sol em qualquer coordenada de MS.
  - Fase lunar exata, porcentagem de iluminação e idade da lua.
  - **Períodos Maiores (Major Periods - 2h)** e **Períodos Menores (Minor Periods - 1h)** de alimentação dos peixes.
  - Índice de Atividade dos Peixes (Ruim, Regular, Bom, Excelente).
- **Clima & Barômetro**:
  - Sincronização automática com API meteorológica quando online, armazenando previsão em cache no IndexedDB para uso offline no barco.
  - Análise da tendência barométrica (pressão subindo x caindo) e segurança de vento para navegação.
  - Guia do Ciclo das Águas Pantaneiras (Cheia, Vazante, Seca, Enchente).

---

### 7. ⚠️ Segurança, SOS & Primeiros Socorros
- **Localização Satelital Instantânea**:
  - Coordenadas em **Graus Decimais** (para GPS e Google Maps).
  - Coordenadas em **Graus, Minutos e Segundos (GMS)** (formato padrão internacional para rádio VHF marítimo/fluvial ou telefone via satélite).
- **Disparo de Socorro**:
  - Botão de cópia rápida com 1 toque.
  - Botão de SMS SOS pré-formatado com link de mapa e coordenadas.
- **Telefones de Emergência com 1 Toque**:
  - PMA / PM: **190**
  - Bombeiros: **193**
  - SAMU: **192**
  - Marinha do Brasil: **185**
- **Manuais de Primeiros Socorros Offline**:
  - Ferrão de arraia de rio (imersão em água quente 45°C; nunca gelo/torniquete).
  - Mordida de piranha e estancamento de hemorragia.
  - Anzol cravado na pele (técnica da linha / avanço da farpa).
  - Picada de serpente (jararaca pantaneira).
  - Tempestade repentina e "vento sul" no Rio Paraguai.

---

### 8. 📖 Diário de Capturas Offline
- Caderno de bordo pessoal do pescador.
- Registro de peixe, tamanho medido, peso aproximado, isca utilizada, coordenadas do ponto e indicação de Pesque e Solte.
- Armazenamento 100% privado no dispositivo via **IndexedDB**.

---

## 🛠️ Tecnologias e Arquitetura

- **Core**: HTML5 Semântico, CSS3 Moderno (Vanilla CSS com Design System exclusivo pantaneiro, variáveis HSL, glassmorphism e modo alto contraste solar).
- **Lógica**: JavaScript Modular (ES6+).
- **PWA (Progressive Web App)**:
  - `manifest.webmanifest` completo com ícones de 192px, 512px e maskable.
  - `sw.js` com estratégia **Cache-First** para o App Shell e vetores, permitindo inicialização instantânea sem nenhuma conexão de internet.
- **Banco de Dados Local**: **IndexedDB** para capturas, waypoints e previsões do tempo.
- **Mapa**: Leaflet.js empacotado localmente no repositório (zero dependência de CDNs externas).
- **Zero Build Step**: Roda nativamente em qualquer navegador moderno (Chrome, Safari, Edge, Firefox).

---

## 🚀 Como Executar Localmente

Você não precisa de ferramentas pesadas de compilação. Basta servir os arquivos estáticos:

```bash
# Opção 1: Usando npx serve
npx serve .

# Opção 2: Usando Python 3
python -m http.server 8080

# Opção 3: Usando Node.js (ou Live Server do VS Code)
```

Abra seu navegador em `http://localhost:8080` (ou na porta indicada).

---

## 📲 Como Instalar no Celular

O PescaMS é um PWA completo:
- **No Android (Google Chrome)**: Toque no menu (três pontinhos) ou no botão `📲 Instalar Aplicativo` no cabeçalho e selecione **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
- **No iPhone / iPad (Safari)**: Toque no botão de compartilhamento (quadrado com seta para cima) e selecione **"Adicionar à Tela de Início"**.

O ícone será adicionado à sua tela inicial e o app funcionará em tela cheia (standalone) como um aplicativo nativo, abrindo instantaneamente mesmo em modo avião ou sem sinal de celular.

---

## 🌐 Publicação no GitHub (Gorude) e Ativação do GitHub Pages

Para disponibilizar o aplicativo publicamente sob a conta GitHub `Gorude`:

1. Crie um novo repositório público no seu GitHub (ex: `app-fll` ou `pesca-ms`).
2. No terminal do projeto, vincule o repositório remoto e faça o push:

```bash
git remote add origin https://github.com/Gorude/<NOME-DO-REPOSITORIO>.git
git branch -M main
git push -u origin main
```

3. **Ativar o GitHub Pages**:
   - Acesse o repositório no GitHub: `https://github.com/Gorude/<NOME-DO-REPOSITORIO>`
   - Vá em **Settings** > **Pages**
   - Em **Build and deployment** > **Source**, selecione **Deploy from a branch** (Branch: `main` / Pasta: `/(root)`) ou selecione **GitHub Actions** (o arquivo `.github/workflows/deploy.yml` já está configurado no repositório).
   - Clique em **Save**.
   - O aplicativo estará no ar publicamente em:
     `https://gorude.github.io/<NOME-DO-REPOSITORIO>/`

---

## 📜 Fontes Oficiais e Base Legal

- **IMASUL** (Instituto de Meio Ambiente de Mato Grosso do Sul): [www.imasul.ms.gov.br](https://www.imasul.ms.gov.br)
- **SEMADESC** (Secretaria de Meio Ambiente, Desenvolvimento, Ciência, Tecnologia e Inovação)
- **Polícia Militar Ambiental de MS (PMA-MS)**
- **Lei Estadual nº 6.390 de 27 de março de 2025** (Proteção do Dourado até 2027)
- **Decreto Estadual nº 15.166 de 21 de fevereiro de 2019** (Regulamentação da Cota de Pesca Amadora)
- **Lei Federal nº 9.605/1998** (Lei de Crimes Ambientais)

---

*Desenvolvido com foco na conservação dos rios e peixes do Pantanal e de Mato Grosso do Sul.* 🌿🐟
