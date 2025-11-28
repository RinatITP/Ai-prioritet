/**
 * AI Assessment v2 - Google Apps Script
 * Автор: Ринат Фатхутдинов
 * Обновлено: добавлено поле "Когорта"
 */

const SESSIONS_SHEET = 'Сессии';
const PROCESSES_SHEET = 'Процессы';

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let sessionsSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet(SESSIONS_SHEET);
    sessionsSheet.appendRow(['ID сессии', 'Дата', 'ФИО', 'Должность', 'Отдел', 'Компания']);
    sessionsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2563eb').setFontColor('white');
    sessionsSheet.setFrozenRows(1);
  }
  
  let processesSheet = ss.getSheetByName(PROCESSES_SHEET);
  if (!processesSheet) {
    processesSheet = ss.insertSheet(PROCESSES_SHEET);
    processesSheet.appendRow([
      'ID сессии', 'Дата', 'ФИО участника', 'Отдел', 'Компания',
      'Название процесса', 'Когорта', 'Часто', 'Долго', 'По шаблону',
      'Тип автоматизации', 'Идея', 'Ценность', 'Реализуемость', 'AI-потенциал',
      'Итого баллов', 'Приоритет'
    ]);
    processesSheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#2563eb').setFontColor('white');
    processesSheet.setFrozenRows(1);
    processesSheet.setColumnWidth(6, 250);
    processesSheet.setColumnWidth(7, 180);
    processesSheet.setColumnWidth(12, 300);
  }
  
  return { sessionsSheet, processesSheet };
}

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === 'getAll') return getAllData();
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'addSession') return addSession(data.data);
    if (data.action === 'addProcesses') return addProcesses(data.data);
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllData() {
  const { sessionsSheet, processesSheet } = initializeSheets();
  
  const sessionsData = sessionsSheet.getDataRange().getValues();
  const sessions = [];
  for (let i = 1; i < sessionsData.length; i++) {
    const row = sessionsData[i];
    if (row[0]) {
      sessions.push({ id: row[0], createdAt: row[1], name: row[2], role: row[3], department: row[4], company: row[5] });
    }
  }
  
  const processesData = processesSheet.getDataRange().getValues();
  const processes = [];
  for (let i = 1; i < processesData.length; i++) {
    const row = processesData[i];
    if (row[0]) {
      processes.push({
        id: row[0] + '_' + i,
        sessionId: row[0],
        savedAt: row[1],
        participant: { name: row[2], department: row[3], company: row[4] },
        name: row[5],
        cohort: row[6],
        frequent: row[7] === 'Да',
        long: row[8] === 'Да',
        template: row[9] === 'Да',
        automationType: row[10] === 'Исключить' ? 'exclude' : row[10] === 'Упростить' ? 'simplify' : 'accelerate',
        idea: row[11],
        valueScore: parseInt(row[12]) || 0,
        feasibilityScore: parseInt(row[13]) || 0,
        aiScore: parseInt(row[14]) || 0
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, sessions, processes })).setMimeType(ContentService.MimeType.JSON);
}

function addSession(sessionData) {
  const { sessionsSheet } = initializeSheets();
  const sessionId = new Date().getTime().toString();
  const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
  
  sessionsSheet.appendRow([sessionId, formattedDate, sessionData.name || '', sessionData.role || '', sessionData.department || '', sessionData.company || '']);
  
  return ContentService.createTextOutput(JSON.stringify({ success: true, sessionId })).setMimeType(ContentService.MimeType.JSON);
}

function addProcesses(data) {
  const { processesSheet } = initializeSheets();
  const { processes, sessionId, participant } = data;
  const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
  
  const automationTypeMap = { 'exclude': 'Исключить', 'simplify': 'Упростить', 'accelerate': 'Ускорить' };
  const priorityMap = (score) => score >= 13 ? '🟢 Делать сразу' : score >= 10 ? '🟡 MVP' : score >= 7 ? '🟠 Backlog' : '⚪ Низкий';
  
  processes.forEach(process => {
    const totalScore = (process.valueScore || 0) + (process.feasibilityScore || 0) + (process.aiScore || 0);
    
    processesSheet.appendRow([
      sessionId,
      formattedDate,
      participant.name || '',
      participant.department || '',
      participant.company || '',
      process.name || '',
      process.cohort || '',
      process.frequent ? 'Да' : 'Нет',
      process.long ? 'Да' : 'Нет',
      process.template ? 'Да' : 'Нет',
      automationTypeMap[process.automationType] || '',
      process.idea || '',
      process.valueScore || 0,
      process.feasibilityScore || 0,
      process.aiScore || 0,
      totalScore,
      priorityMap(totalScore)
    ]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function testInit() {
  initializeSheets();
  Logger.log('Таблицы инициализированы!');
}
