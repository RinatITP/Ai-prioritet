/**
 * AI Assessment - Google Apps Script
 * Автор: Ринат Фатхутдинов
 * 
 * ИНСТРУКЦИЯ ПО УСТАНОВКЕ:
 * 
 * 1. Откройте Google Sheets: https://sheets.google.com
 * 2. Создайте новую таблицу с названием "AI Assessment Data"
 * 3. Перейдите в меню: Расширения → Apps Script
 * 4. Удалите весь код в редакторе
 * 5. Скопируйте и вставьте ВЕСЬ этот код
 * 6. Нажмите "Сохранить" (Ctrl+S)
 * 7. Нажмите "Развернуть" → "Новое развертывание"
 * 8. Выберите тип: "Веб-приложение"
 * 9. Настройки:
 *    - Описание: "AI Assessment API"
 *    - Выполнять как: "Я"
 *    - Доступ: "Все" (Anyone)
 * 10. Нажмите "Развернуть"
 * 11. Скопируйте URL веб-приложения
 * 12. Вставьте этот URL в файл App.jsx вместо 'YOUR_GOOGLE_SCRIPT_URL_HERE'
 */

// Имена листов
const SESSIONS_SHEET = 'Сессии';
const PROCESSES_SHEET = 'Процессы';

/**
 * Инициализация таблицы при первом запуске
 */
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Создаём лист "Сессии" если его нет
  let sessionsSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessionsSheet) {
    sessionsSheet = ss.insertSheet(SESSIONS_SHEET);
    sessionsSheet.appendRow([
      'ID сессии',
      'Дата',
      'ФИО',
      'Должность', 
      'Отдел',
      'Компания'
    ]);
    sessionsSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ff6b35').setFontColor('white');
    sessionsSheet.setFrozenRows(1);
  }
  
  // Создаём лист "Процессы" если его нет
  let processesSheet = ss.getSheetByName(PROCESSES_SHEET);
  if (!processesSheet) {
    processesSheet = ss.insertSheet(PROCESSES_SHEET);
    processesSheet.appendRow([
      'ID сессии',
      'Дата',
      'ФИО участника',
      'Отдел',
      'Компания',
      'Название процесса',
      'Часто',
      'Долго',
      'По шаблону',
      'Тип автоматизации',
      'Идея',
      'Ценность',
      'Реализуемость',
      'AI-потенциал',
      'Итого баллов',
      'Приоритет'
    ]);
    processesSheet.getRange(1, 1, 1, 16).setFontWeight('bold').setBackground('#ff6b35').setFontColor('white');
    processesSheet.setFrozenRows(1);
    
    // Настраиваем ширину колонок
    processesSheet.setColumnWidth(6, 250); // Название процесса
    processesSheet.setColumnWidth(11, 300); // Идея
  }
  
  return { sessionsSheet, processesSheet };
}

/**
 * Обработка GET запросов (получение данных)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    if (action === 'getAll') {
      return getAllData();
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Обработка POST запросов (сохранение данных)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'addSession') {
      return addSession(data.data);
    }
    
    if (action === 'addProcesses') {
      return addProcesses(data.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Получение всех данных
 */
function getAllData() {
  const { sessionsSheet, processesSheet } = initializeSheets();
  
  // Получаем сессии
  const sessionsData = sessionsSheet.getDataRange().getValues();
  const sessions = [];
  for (let i = 1; i < sessionsData.length; i++) {
    const row = sessionsData[i];
    if (row[0]) {
      sessions.push({
        id: row[0],
        createdAt: row[1],
        name: row[2],
        role: row[3],
        department: row[4],
        company: row[5]
      });
    }
  }
  
  // Получаем процессы
  const processesData = processesSheet.getDataRange().getValues();
  const processes = [];
  for (let i = 1; i < processesData.length; i++) {
    const row = processesData[i];
    if (row[0]) {
      processes.push({
        id: row[0] + '_' + i,
        sessionId: row[0],
        savedAt: row[1],
        participant: {
          name: row[2],
          department: row[3],
          company: row[4]
        },
        name: row[5],
        frequent: row[6] === 'Да',
        long: row[7] === 'Да',
        template: row[8] === 'Да',
        automationType: row[9] === 'Исключить' ? 'exclude' : row[9] === 'Упростить' ? 'simplify' : 'accelerate',
        idea: row[10],
        valueScore: parseInt(row[11]) || 0,
        feasibilityScore: parseInt(row[12]) || 0,
        aiScore: parseInt(row[13]) || 0
      });
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ 
      success: true, 
      sessions: sessions,
      processes: processes 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Добавление сессии
 */
function addSession(sessionData) {
  const { sessionsSheet } = initializeSheets();
  
  const sessionId = new Date().getTime().toString();
  const now = new Date();
  const formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
  
  sessionsSheet.appendRow([
    sessionId,
    formattedDate,
    sessionData.name || '',
    sessionData.role || '',
    sessionData.department || '',
    sessionData.company || ''
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, sessionId: sessionId }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Добавление процессов
 */
function addProcesses(data) {
  const { processesSheet } = initializeSheets();
  
  const { processes, sessionId, participant } = data;
  const now = new Date();
  const formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');
  
  const automationTypeMap = {
    'exclude': 'Исключить',
    'simplify': 'Упростить',
    'accelerate': 'Ускорить'
  };
  
  const priorityMap = (score) => {
    if (score >= 13) return '🟢 Делать сразу';
    if (score >= 10) return '🟡 MVP';
    if (score >= 7) return '🟠 Backlog';
    return '⚪ Низкий';
  };
  
  processes.forEach(process => {
    const totalScore = (process.valueScore || 0) + (process.feasibilityScore || 0) + (process.aiScore || 0);
    
    processesSheet.appendRow([
      sessionId,
      formattedDate,
      participant.name || '',
      participant.department || '',
      participant.company || '',
      process.name || '',
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
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Тестовая функция для проверки
 */
function testInit() {
  initializeSheets();
  Logger.log('Таблицы инициализированы!');
}
