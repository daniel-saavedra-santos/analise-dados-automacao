/**
 * Painel de Análise — Levantamento de Deficiências Tecnológicas em Automação
 * Embrapa Caprinos e Ovinos
 *
 * Projeto SEPARADO do formulário. Ele apenas LÊ a planilha do levantamento
 * e cria uma planilha própria ("Levantamento - Análises") para a
 * categorização das tarefas. Nenhum dado do formulário é alterado.
 *
 * Arquivos do projeto: Code.gs, index.html, styles.html, app.html
 */

const CONFIG = {
  // Cole aqui o ID da planilha do levantamento: é o trecho da URL entre /d/ e /edit
  // Ex.: https://docs.google.com/spreadsheets/d/ESTE_TRECHO_AQUI/edit
  planilhaLevantamentoId: '',
  titulo: 'Painel de Análise — Levantamento de Automação',
  propPlanilhaAnalise: 'ANALISE_SPREADSHEET_ID',
  abaCategorias: 'Categorias_tarefas'
};

/* ------------------------------------------------------------------ */
/* Web App                                                             */
/* ------------------------------------------------------------------ */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle(CONFIG.titulo)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Execute uma vez no editor, depois de preencher CONFIG.planilhaLevantamentoId.
 * Cria a planilha "Levantamento - Análises" com a aba de categorização das tarefas.
 */
function setupAnalise() {
  const fonte = abrirFonte_();
  const props = PropertiesService.getScriptProperties();
  let analise;
  const existente = props.getProperty(CONFIG.propPlanilhaAnalise);
  if (existente) {
    analise = SpreadsheetApp.openById(existente);
  } else {
    analise = SpreadsheetApp.create('Levantamento - Análises');
    props.setProperty(CONFIG.propPlanilhaAnalise, analise.getId());
  }
  const resultado = atualizarCategorias();
  const info = {
    planilhaLevantamento: fonte.getUrl(),
    planilhaAnalises: analise.getUrl(),
    tarefasListadas: resultado.total
  };
  Logger.log(JSON.stringify(info, null, 2));
  return info;
}

/** Dados brutos para o painel (os cálculos e filtros são feitos na página). */
function getDados() {
  const fonte = abrirFonte_();
  const analise = abrirAnalise_();
  return {
    geradoEm: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy 'às' HH:mm"),
    planilhaUrl: fonte.getUrl(),
    analiseUrl: analise ? analise.getUrl() : '',
    respostas: sheetObjects_(fonte.getSheetByName('Respostas')),
    tarefas: sheetObjects_(fonte.getSheetByName('Tarefas')),
    tecnologias: sheetObjects_(fonte.getSheetByName('Tecnologias')),
    categorias: lerCategorias_(analise)
  };
}

/**
 * Atualiza a aba "Categorias_tarefas" com todas as tarefas já citadas.
 * Categorias que você já preencheu são mantidas.
 */
function atualizarCategorias() {
  const fonte = abrirFonte_();
  const analise = abrirAnalise_();
  if (!analise) throw new Error('Execute a função setupAnalise() uma vez no editor do Apps Script.');

  let sh = analise.getSheetByName(CONFIG.abaCategorias);
  if (!sh) {
    sh = analise.insertSheet(CONFIG.abaCategorias, 0);
    const padrao = analise.getSheetByName('Página1') || analise.getSheetByName('Sheet1') || analise.getSheetByName('Planilha1');
    if (padrao && padrao.getLastRow() === 0) analise.deleteSheet(padrao);
  }

  // Categorias já preenchidas
  const anteriores = {};
  if (sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) {
      if (r[0]) anteriores[String(r[0])] = String(r[3] || '').trim();
    });
  }

  // Tarefas citadas, agrupadas pelo texto normalizado
  const grupos = {};
  sheetObjects_(fonte.getSheetByName('Tarefas')).forEach(function (t) {
    const texto = String(t.tarefa || '').trim();
    if (!texto) return;
    const chave = chave_(texto);
    if (!grupos[chave]) grupos[chave] = { n: 0, textos: {} };
    grupos[chave].n++;
    grupos[chave].textos[texto] = (grupos[chave].textos[texto] || 0) + 1;
  });

  const chaves = Object.keys(grupos).sort(function (a, b) { return grupos[b].n - grupos[a].n || a.localeCompare(b); });
  const linhas = chaves.map(function (k) {
    const textos = grupos[k].textos;
    const exemplo = Object.keys(textos).sort(function (a, b) { return textos[b] - textos[a]; })[0];
    return [k, exemplo, grupos[k].n, anteriores[k] || ''];
  });

  let novas = 0;
  chaves.forEach(function (k) { if (!(k in anteriores)) novas++; });

  sh.clearContents();
  sh.getRange(1, 1, 1, 4).setValues([['chave (não editar)', 'tarefa (exemplo)', 'citações', 'categoria (preencha)']]).setFontWeight('bold');
  if (linhas.length) sh.getRange(2, 1, linhas.length, 4).setValues(linhas);
  sh.setFrozenRows(1);
  sh.getRange('D1').setBackground('#eaf5ee');

  return { total: linhas.length, novas: novas, url: analise.getUrl() };
}

/* ------------------------------------------------------------------ */
/* Auxiliares                                                          */
/* ------------------------------------------------------------------ */

function abrirFonte_() {
  if (!CONFIG.planilhaLevantamentoId) {
    throw new Error('Preencha CONFIG.planilhaLevantamentoId no Code.gs com o ID da planilha do levantamento.');
  }
  return SpreadsheetApp.openById(CONFIG.planilhaLevantamentoId);
}

function abrirAnalise_() {
  const id = PropertiesService.getScriptProperties().getProperty(CONFIG.propPlanilhaAnalise);
  return id ? SpreadsheetApp.openById(id) : null;
}

function lerCategorias_(analise) {
  const out = {};
  if (!analise) return out;
  const sh = analise.getSheetByName(CONFIG.abaCategorias);
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) {
    const cat = String(r[3] || '').trim();
    if (r[0] && cat) out[String(r[0])] = cat;
  });
  return out;
}

/** Mesma normalização usada no formulário para juntar tarefas iguais. */
function chave_(s) {
  return String(s == null ? '' : s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lê uma aba como lista de objetos (datas viram texto, para poderem ir à página). */
function sheetObjects_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(function (row) { return row[0] !== ''; }).map(function (row) {
    const obj = {};
    headers.forEach(function (h, i) {
      const v = row[i];
      obj[h] = v instanceof Date ? v.toISOString() : v;
    });
    return obj;
  });
}
