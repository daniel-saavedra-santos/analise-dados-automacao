# Painel de Análise — Levantamento de Automação (Embrapa Caprinos e Ovinos)

Projeto do Apps Script **separado do formulário**. Ele só **lê** a planilha do levantamento; nenhuma resposta é alterada.

## Instalação (uma vez)

1. Em https://script.google.com, crie um **novo projeto** (ex.: "Painel de Análise - Levantamento").
2. Crie os arquivos `Code.gs`, `index.html`, `styles.html` e `app.html` e cole o conteúdo de cada um.
3. Abra a planilha do levantamento e copie o **ID** dela: o trecho da URL entre `/d/` e `/edit`.
4. No `Code.gs`, cole o ID entre as aspas de `planilhaLevantamentoId: ''`.
5. Selecione a função `setupAnalise` e clique em **Executar**. Autorize o acesso.
   Ela cria a planilha **"Levantamento - Análises"** (com a aba `Categorias_tarefas`).
6. **Implantar → Nova implantação → Aplicativo da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Somente eu** (ou pessoas da sua organização)
   - ⚠️ Não use "Qualquer pessoa": o painel mostra as respostas.
7. Abra a URL do aplicativo. O painel carrega os dados atuais sempre que você clica em **Atualizar dados**.

## O que o painel mostra

| Aba | Conteúdo |
|---|---|
| Visão geral | Totais, respondentes por área, último treinamento, habilidade digital, tarefas mais citadas |
| Importância × Satisfação | Matriz com quadrantes, índice de oportunidade e ranking das tarefas |
| Modo de execução | Manual / parcial / automatizado nas 15 tarefas mais citadas |
| Barreiras | % de respondentes por barreira e equipamentos ausentes citados |
| Tecnologias | Situação (códigos 0–5) de cada tecnologia e indicadores de adoção (Analistas/Pesquisadores) |
| Respostas abertas | Todas as respostas em texto, com busca e exportação |
| Categorizar tarefas | Agrupamento de tarefas escritas de formas diferentes |

Filtros: perfil, área/setor, origem da tarefa (tempo ou esforço) e mínimo de citações (na matriz).
Cada gráfico tem **PNG** (imagem para relatórios), **CSV** (abre no Excel pt-BR) e **Ver tabela**.

## Agrupar tarefas (importante para a matriz)

As tarefas são digitadas livremente ("ordenha", "ordenha das cabras"…). Para somá-las:

1. Na aba **Categorizar tarefas**, clique em **Atualizar lista de tarefas**.
2. Abra a planilha "Levantamento - Análises", aba `Categorias_tarefas`, e escreva a categoria na coluna D
   (ex.: "Ordenha" para todas as variações). Não edite a coluna A.
3. No painel, clique em **Atualizar dados**.

Repita o passo 1 sempre que chegarem respostas novas: categorias já preenchidas são mantidas.

## Como os números são calculados

- **Importância e satisfação**: média das notas (1–5) de cada tarefa/categoria.
- **Quadrantes**: divididos no valor 3 (meio da escala).
- **Índice de oportunidade** = importância + max(importância − satisfação, 0) (adaptado de Ulwick, 2002).
- **Tecnologias**: percentuais sobre quem opinou (códigos 0–4); "não consigo opinar" (5) é mostrado à parte.
  - conhece = códigos 1–4 · existe na unidade = 2–4 · usa = 3–4 · existe mas nunca usou = 2.
- Respostas de versões antigas do formulário (abas `_v1`) não entram no painel.
