import React, { useState, useEffect, useCallback } from 'react';

// ============================================
// НАСТРОЙКА: Вставь сюда URL своего Google Apps Script
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyj9l0EyGKLGkFwAxDouydmecXeSPWjHUIcryzRTUx6S6ZyvGJ4WHq-BX3sF4maEyCU/exec';
// ============================================

// Списки отделов и когорт
const DEPARTMENTS = [
  'Охрана труда и безопасность',
  'Производство',
  'Логистика',
  'IT',
  'HR / Кадры',
  'Финансы / Бухгалтерия',
  'Закупки',
  'Маркетинг',
  'Продажи',
  'Прочее'
];

const COHORTS = [
  'Производственные процессы',
  'Административные процессы',
  'Управленческие процессы',
  'Документооборот',
  'Коммуникации',
  'Аналитика и отчётность',
  'Работа с клиентами',
  'Закупки и снабжение',
  'Контроль и аудит',
  'Прочее'
];

// Критерии оценки
const VALUE_CRITERIA = [
  { id: 'v1', label: 'Экономит более 2 часов в неделю', hint: 'Процесс занимает много времени и выполняется регулярно' },
  { id: 'v2', label: 'Снижает количество ошибок', hint: 'Ручное выполнение часто приводит к ошибкам' },
  { id: 'v3', label: 'Влияет на KPI отдела/компании', hint: 'Результат процесса напрямую влияет на показатели' },
  { id: 'v4', label: 'Ускоряет принятие решений', hint: 'Быстрее получаем данные для решений' },
  { id: 'v5', label: 'Улучшает качество работы', hint: 'Повышает точность, полноту, своевременность' }
];

const FEASIBILITY_CRITERIA = [
  { id: 'f1', label: 'Процесс понятен и описан', hint: 'Есть чёткий алгоритм выполнения' },
  { id: 'f2', label: 'Данные доступны в электронном виде', hint: 'Информация уже в Excel, 1C, CRM и т.д.' },
  { id: 'f3', label: 'Не требует сложных согласований', hint: 'Можно внедрить на уровне отдела' },
  { id: 'f4', label: 'Есть ответственный за внедрение', hint: 'Кто-то готов курировать автоматизацию' },
  { id: 'f5', label: 'Низкие риски при ошибке', hint: 'Ошибка не приведёт к серьёзным последствиям' }
];

const AI_CRITERIA = [
  { id: 'a1', label: 'Повторяющиеся действия', hint: 'Одни и те же шаги каждый раз' },
  { id: 'a2', label: 'Работа с текстом/документами', hint: 'Чтение, анализ, создание документов' },
  { id: 'a3', label: 'Есть шаблоны и правила', hint: 'Можно формализовать логику' },
  { id: 'a4', label: 'Большой объём данных', hint: 'Много информации для обработки' },
  { id: 'a5', label: 'Не требует творческих решений', hint: 'Алгоритмическая, а не креативная работа' }
];

// Примеры для типов автоматизации
const AUTOMATION_EXAMPLES = {
  exclude: {
    title: 'Исключить',
    icon: '🚫',
    description: 'Полностью убрать процесс как ненужный',
    examples: [
      'Дублирующие отчёты, которые никто не читает',
      'Согласования "для галочки"',
      'Ручной перенос данных между системами',
      'Печать документов для архива при наличии электронного'
    ]
  },
  simplify: {
    title: 'Упростить',
    icon: '✂️',
    description: 'Сократить шаги, убрать лишнее',
    examples: [
      'Объединить 3 формы в одну',
      'Убрать лишние этапы согласования',
      'Заменить совещание на асинхронное обсуждение',
      'Использовать шаблоны вместо создания с нуля'
    ]
  },
  accelerate: {
    title: 'Ускорить',
    icon: '🚀',
    description: 'Автоматизировать с помощью ИИ/RPA',
    examples: [
      'Автозаполнение документов из базы данных',
      'ИИ-анализ входящих заявок',
      'Автоматическая генерация отчётов',
      'Чат-бот для типовых вопросов сотрудников'
    ]
  }
};

// Примеры процессов для вдохновения
const PROCESS_EXAMPLES = [
  'Подготовка ежемесячного отчёта',
  'Согласование заявок на закупку',
  'Обработка входящих документов',
  'Заполнение табеля учёта рабочего времени',
  'Подготовка презентаций для руководства',
  'Ответы на типовые вопросы сотрудников',
  'Проверка соответствия документов требованиям',
  'Сбор данных из разных источников'
];

// Database Hook - ИСПРАВЛЕННАЯ ВЕРСИЯ с GET запросами для обхода CORS
const useDatabase = () => {
  const [data, setData] = useState({
    sessions: [],
    processes: [],
    isLoading: false,
    error: null,
    isConfigured: GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE'
  });

  const loadData = useCallback(async () => {
    if (!data.isConfigured) {
      const saved = JSON.parse(localStorage.getItem('ai_assessment_v2') || '{"sessions":[],"processes":[]}');
      setData(prev => ({ ...prev, sessions: saved.sessions, processes: saved.processes }));
      return;
    }
    
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`);
      const result = await response.json();
      if (result.success) {
        setData(prev => ({
          ...prev,
          sessions: result.sessions || [],
          processes: result.processes || [],
          isLoading: false
        }));
      } else {
        throw new Error(result.error || 'Ошибка загрузки');
      }
    } catch (error) {
      setData(prev => ({ ...prev, isLoading: false, error: error.message }));
      const saved = JSON.parse(localStorage.getItem('ai_assessment_v2') || '{"sessions":[],"processes":[]}');
      setData(prev => ({ ...prev, sessions: saved.sessions, processes: saved.processes }));
    }
  }, [data.isConfigured]);

  useEffect(() => { loadData(); }, []);

  // Сохранение сессии через GET (обход CORS)
  const saveSession = async (sessionData) => {
    const sessionId = Date.now().toString();
    const newSession = { ...sessionData, id: sessionId, createdAt: new Date().toISOString() };
    
    // Сохраняем в localStorage как бэкап
    const saved = JSON.parse(localStorage.getItem('ai_assessment_v2') || '{"sessions":[],"processes":[]}');
    saved.sessions.push(newSession);
    localStorage.setItem('ai_assessment_v2', JSON.stringify(saved));

    if (data.isConfigured) {
      try {
        // Используем GET запрос с параметрами (работает с CORS)
        const params = new URLSearchParams({
          action: 'addSession',
          name: sessionData.name || '',
          role: sessionData.role || '',
          department: sessionData.department || '',
          company: sessionData.company || ''
        });
        
        // Создаём Image для отправки GET запроса (гарантированно работает)
        const img = new Image();
        img.src = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
        
        console.log('Session save request sent:', sessionId);
      } catch (error) {
        console.error('Ошибка сохранения сессии:', error);
      }
    }
    return sessionId;
  };

  // Сохранение процессов через GET (обход CORS)
  const saveProcesses = async (processes, sessionId, participant) => {
    // Сохраняем в localStorage
    const saved = JSON.parse(localStorage.getItem('ai_assessment_v2') || '{"sessions":[],"processes":[]}');
    processes.forEach(p => {
      saved.processes.push({ ...p, sessionId, participant, savedAt: new Date().toISOString() });
    });
    localStorage.setItem('ai_assessment_v2', JSON.stringify(saved));

    if (data.isConfigured) {
      // Отправляем каждый процесс отдельным GET запросом
      for (const p of processes) {
        try {
          const params = new URLSearchParams({
            action: 'addProcess',
            sessionId: sessionId,
            participantName: participant.name || '',
            participantDept: participant.department || '',
            participantCompany: participant.company || '',
            processName: p.name || '',
            cohort: p.cohort || '',
            frequent: p.frequent ? 'true' : 'false',
            long: p.long ? 'true' : 'false',
            template: p.template ? 'true' : 'false',
            automationType: p.automationType || '',
            idea: encodeURIComponent(p.idea || ''),
            valueScore: (p.valueScore || 0).toString(),
            feasibilityScore: (p.feasibilityScore || 0).toString(),
            aiScore: (p.aiScore || 0).toString()
          });
          
          // Используем Image для GET запроса
          const img = new Image();
          img.src = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
          
          console.log('Process save request sent:', p.name);
          
          // Небольшая задержка между запросами
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Ошибка сохранения процесса:', error);
        }
      }
    }
    
    // Обновляем данные через 2 секунды
    setTimeout(() => loadData(), 2000);
  };

  return { data, saveSession, saveProcesses, loadData, isConfigured: data.isConfigured };
};

// Styles - Light Professional Theme
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --bg-primary: #f8fafc;
    --bg-secondary: #ffffff;
    --bg-tertiary: #f1f5f9;
    --bg-card: #ffffff;
    --accent-primary: #2563eb;
    --accent-secondary: #3b82f6;
    --accent-green: #10b981;
    --accent-orange: #f59e0b;
    --accent-red: #ef4444;
    --accent-purple: #8b5cf6;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;
    --border-color: #e2e8f0;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
    background: var(--bg-primary); 
    color: var(--text-primary); 
    min-height: 100vh;
    line-height: 1.5;
  }
  
  .app-container { min-height: 100vh; }
  
  /* Navigation */
  .nav { 
    position: sticky; 
    top: 0; 
    z-index: 100; 
    background: var(--bg-secondary); 
    border-bottom: 1px solid var(--border-color); 
    padding: 0 1rem;
    box-shadow: var(--shadow-sm);
  }
  
  .nav-inner { 
    max-width: 1200px; 
    margin: 0 auto; 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    height: 60px;
    gap: 1rem;
  }
  
  .logo { 
    display: flex; 
    align-items: center; 
    gap: 10px;
    flex-shrink: 0;
  }
  
  .logo-icon { 
    width: 36px; 
    height: 36px; 
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); 
    border-radius: 10px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 18px;
    color: white;
  }
  
  .logo-text { 
    font-weight: 700; 
    font-size: 1.1rem;
    color: var(--text-primary);
  }
  
  .logo-text span { color: var(--accent-primary); }
  
  .nav-links { 
    display: flex; 
    gap: 4px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .nav-link { 
    padding: 8px 16px; 
    border-radius: 8px; 
    background: transparent; 
    border: none; 
    color: var(--text-secondary); 
    font-family: inherit;
    font-weight: 500; 
    font-size: 0.9rem; 
    cursor: pointer; 
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .nav-link:hover { background: var(--bg-tertiary); color: var(--text-primary); }
  .nav-link.active { background: var(--accent-primary); color: white; }
  
  /* Main Content */
  .main { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem; }
  
  .page-header { margin-bottom: 1.5rem; }
  .page-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--text-primary); }
  .page-subtitle { color: var(--text-secondary); font-size: 0.95rem; }
  
  /* Cards */
  .card { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    border-radius: 12px; 
    padding: 1.25rem; 
    margin-bottom: 1rem;
    box-shadow: var(--shadow-sm);
  }
  
  .card-header { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .card-icon { 
    width: 40px; 
    height: 40px; 
    border-radius: 10px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    font-size: 20px;
  }
  
  .card-icon.blue { background: rgba(37, 99, 235, 0.1); }
  .card-icon.green { background: rgba(16, 185, 129, 0.1); }
  .card-icon.orange { background: rgba(245, 158, 11, 0.1); }
  .card-icon.purple { background: rgba(139, 92, 246, 0.1); }
  
  .card-title { font-size: 1.1rem; font-weight: 600; }
  
  /* Forms */
  .form-group { margin-bottom: 1rem; }
  
  .form-label { 
    display: block; 
    font-size: 0.85rem; 
    font-weight: 600; 
    color: var(--text-secondary); 
    margin-bottom: 0.5rem;
  }
  
  .form-input { 
    width: 100%; 
    padding: 12px 14px; 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    border-radius: 8px; 
    color: var(--text-primary); 
    font-family: inherit;
    font-size: 1rem; 
    transition: all 0.2s ease;
  }
  
  .form-input:focus { 
    outline: none; 
    border-color: var(--accent-primary); 
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  .form-input::placeholder { color: var(--text-muted); }
  
  textarea.form-input { min-height: 80px; resize: vertical; }
  
  select.form-input { 
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 40px;
    appearance: none;
  }
  
  /* Buttons */
  .btn { 
    padding: 12px 20px; 
    border-radius: 8px; 
    border: none; 
    font-family: inherit;
    font-weight: 600; 
    font-size: 0.95rem; 
    cursor: pointer; 
    transition: all 0.2s ease; 
    display: inline-flex; 
    align-items: center; 
    gap: 8px;
  }
  
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  
  .btn-primary { 
    background: var(--accent-primary); 
    color: white;
  }
  
  .btn-primary:hover:not(:disabled) { 
    background: #1d4ed8;
    transform: translateY(-1px);
  }
  
  .btn-secondary { 
    background: var(--bg-tertiary); 
    color: var(--text-primary); 
    border: 1px solid var(--border-color);
  }
  
  .btn-secondary:hover:not(:disabled) { 
    background: var(--border-color);
  }
  
  .btn-sm { padding: 8px 14px; font-size: 0.85rem; }
  
  /* Checkbox Items */
  .checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
  
  .checkbox-item { 
    display: flex; 
    align-items: flex-start; 
    gap: 12px; 
    padding: 12px 14px; 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    border-radius: 8px; 
    cursor: pointer; 
    transition: all 0.2s ease;
  }
  
  .checkbox-item:hover { border-color: var(--accent-primary); }
  .checkbox-item.checked { background: rgba(37, 99, 235, 0.05); border-color: var(--accent-primary); }
  .checkbox-item input { display: none; }
  
  .checkbox-box { 
    width: 22px; 
    height: 22px; 
    border: 2px solid var(--border-color); 
    border-radius: 6px; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-top: 1px;
    font-size: 14px;
    color: white;
  }
  
  .checkbox-item.checked .checkbox-box { 
    background: var(--accent-primary); 
    border-color: var(--accent-primary);
  }
  
  .checkbox-content { flex: 1; }
  .checkbox-label { font-weight: 500; font-size: 0.95rem; }
  .checkbox-hint { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }
  
  /* Process characteristics - horizontal on mobile */
  .char-group { 
    display: flex; 
    gap: 0.5rem; 
    flex-wrap: wrap;
  }
  
  .char-item { 
    display: flex; 
    align-items: center; 
    gap: 8px; 
    padding: 10px 14px; 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    border-radius: 8px; 
    cursor: pointer; 
    transition: all 0.2s ease;
    flex: 1;
    min-width: 100px;
    justify-content: center;
  }
  
  .char-item:hover { border-color: var(--accent-primary); }
  .char-item.checked { background: rgba(37, 99, 235, 0.1); border-color: var(--accent-primary); }
  .char-item input { display: none; }
  
  /* Automation Type Selection */
  .automation-select { display: flex; flex-direction: column; gap: 0.75rem; }
  
  .automation-option { 
    padding: 1rem; 
    background: var(--bg-primary); 
    border: 2px solid var(--border-color); 
    border-radius: 10px; 
    cursor: pointer; 
    transition: all 0.2s ease;
  }
  
  .automation-option:hover { border-color: var(--text-muted); }
  .automation-option.selected { border-color: var(--accent-primary); background: rgba(37, 99, 235, 0.05); }
  .automation-option.selected.exclude { border-color: var(--accent-red); background: rgba(239, 68, 68, 0.05); }
  .automation-option.selected.simplify { border-color: var(--accent-orange); background: rgba(245, 158, 11, 0.05); }
  .automation-option.selected.accelerate { border-color: var(--accent-green); background: rgba(16, 185, 129, 0.05); }
  
  .automation-header { display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem; }
  .automation-icon { font-size: 1.25rem; }
  .automation-title { font-weight: 600; }
  .automation-desc { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; }
  
  .automation-examples { 
    background: var(--bg-secondary); 
    border-radius: 6px; 
    padding: 0.75rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  
  .automation-examples-title { font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
  .automation-examples ul { margin: 0; padding-left: 1.25rem; }
  .automation-examples li { margin-bottom: 0.25rem; }
  
  /* Score Card */
  .score-card { 
    background: var(--bg-tertiary); 
    border-radius: 10px; 
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .score-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .score-title { font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .score-title-icon { font-size: 1.25rem; }
  .score-value { 
    font-weight: 700; 
    font-size: 1.25rem; 
    color: var(--accent-primary);
    background: var(--bg-secondary);
    padding: 4px 12px;
    border-radius: 6px;
  }
  
  /* Process List */
  .process-list { display: flex; flex-direction: column; gap: 0.75rem; }
  
  .process-item { 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    border-radius: 10px; 
    padding: 1rem;
    transition: all 0.2s ease;
  }
  
  .process-item:hover { border-color: var(--accent-primary); }
  
  .process-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .process-name { font-weight: 600; margin-bottom: 0.5rem; }
  .process-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  
  .tag { 
    padding: 4px 10px; 
    border-radius: 6px; 
    font-size: 0.75rem; 
    font-weight: 600;
  }
  
  .tag.frequent { background: rgba(37, 99, 235, 0.1); color: var(--accent-primary); }
  .tag.long { background: rgba(139, 92, 246, 0.1); color: var(--accent-purple); }
  .tag.template { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
  .tag.fruit { background: rgba(245, 158, 11, 0.1); color: var(--accent-orange); }
  
  .process-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
  
  /* Stats Grid */
  .stats-grid { 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); 
    gap: 0.75rem; 
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 768px) {
    .stats-grid { grid-template-columns: repeat(4, 1fr); }
  }
  
  .stat-card { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    border-radius: 12px; 
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .stat-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
  .stat-card.clickable { cursor: pointer; }
  
  .stat-value { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; }
  .stat-value.blue { color: var(--accent-primary); }
  .stat-value.green { color: var(--accent-green); }
  .stat-value.orange { color: var(--accent-orange); }
  .stat-value.purple { color: var(--accent-purple); }
  
  .stat-label { color: var(--text-secondary); font-size: 0.85rem; }
  
  /* Charts */
  .chart-container { 
    background: var(--bg-card); 
    border: 1px solid var(--border-color); 
    border-radius: 12px; 
    padding: 1.25rem; 
    margin-bottom: 1rem;
  }
  
  .chart-title { 
    font-weight: 600; 
    margin-bottom: 1rem; 
    display: flex; 
    align-items: center; 
    gap: 8px;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .bar-chart { display: flex; flex-direction: column; gap: 0.75rem; }
  
  .bar-item { 
    display: grid; 
    grid-template-columns: 100px 1fr 50px; 
    gap: 0.75rem; 
    align-items: center;
  }
  
  @media (min-width: 768px) {
    .bar-item { grid-template-columns: 140px 1fr 60px; }
  }
  
  .bar-label { font-size: 0.85rem; color: var(--text-secondary); }
  .bar-track { height: 28px; background: var(--bg-tertiary); border-radius: 6px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }
  .bar-value { font-weight: 600; text-align: right; font-size: 0.9rem; }
  
  /* Cohort Grid */
  .cohort-grid { 
    display: grid; 
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .cohort-grid { grid-template-columns: repeat(2, 1fr); }
  }
  
  .cohort-card { 
    background: var(--bg-primary); 
    border: 1px solid var(--border-color); 
    border-radius: 10px; 
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cohort-card:hover { border-color: var(--accent-primary); }
  
  .cohort-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .cohort-name { font-weight: 600; font-size: 0.95rem; }
  .cohort-count { 
    font-size: 0.8rem; 
    color: var(--text-muted); 
    background: var(--bg-tertiary); 
    padding: 2px 8px; 
    border-radius: 4px;
  }
  
  .cohort-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .cohort-stat { text-align: center; }
  .cohort-stat-value { font-weight: 700; font-size: 1.1rem; }
  .cohort-stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
  
  /* Priority Badges */
  .priority-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
  }
  
  .priority-high { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
  .priority-medium { background: rgba(245, 158, 11, 0.1); color: var(--accent-orange); }
  .priority-low { background: rgba(100, 116, 139, 0.1); color: var(--text-secondary); }
  
  /* Steps Indicator */
  .steps-indicator { 
    display: flex; 
    gap: 0.5rem; 
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
  
  .step { 
    flex: 1;
    min-width: 80px;
    padding: 0.75rem 0.5rem; 
    background: var(--bg-secondary); 
    border: 1px solid var(--border-color); 
    border-radius: 8px; 
    text-align: center;
    transition: all 0.2s ease;
  }
  
  .step.active { background: rgba(37, 99, 235, 0.1); border-color: var(--accent-primary); }
  .step.completed { background: rgba(16, 185, 129, 0.1); border-color: var(--accent-green); }
  
  .step-number { 
    width: 24px; 
    height: 24px; 
    border-radius: 50%; 
    background: var(--bg-tertiary); 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    font-weight: 700; 
    font-size: 0.8rem; 
    margin-bottom: 0.25rem;
  }
  
  .step.active .step-number { background: var(--accent-primary); color: white; }
  .step.completed .step-number { background: var(--accent-green); color: white; }
  
  .step-label { font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); }
  .step.active .step-label, .step.completed .step-label { color: var(--text-primary); }
  
  /* Alert */
  .alert { 
    padding: 0.75rem 1rem; 
    border-radius: 8px; 
    margin-bottom: 1rem; 
    display: flex; 
    align-items: center; 
    gap: 10px;
    font-size: 0.9rem;
  }
  
  .alert-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--accent-green); }
  .alert-warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: var(--accent-orange); }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal {
    background: var(--bg-secondary);
    border-radius: 12px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }
  
  .modal-header {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-title { font-weight: 600; font-size: 1.1rem; }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
    padding: 0;
    line-height: 1;
  }
  
  .modal-body { padding: 1.25rem; }
  
  /* Data Table */
  .table-container { overflow-x: auto; margin: -0.5rem; padding: 0.5rem; }
  
  .data-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  .data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); }
  .data-table th { font-weight: 600; color: var(--text-secondary); background: var(--bg-tertiary); font-size: 0.8rem; text-transform: uppercase; }
  .data-table tbody tr:hover { background: var(--bg-tertiary); }
  
  /* Empty State */
  .empty-state { text-align: center; padding: 3rem 1rem; }
  .empty-state-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
  .empty-state-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; }
  .empty-state-text { color: var(--text-secondary); font-size: 0.9rem; }
  
  /* Success Screen */
  .success-screen { text-align: center; padding: 3rem 1rem; }
  .success-icon { font-size: 4rem; margin-bottom: 1rem; }
  .success-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
  .success-text { color: var(--text-secondary); margin-bottom: 1.5rem; }
  
  /* Helpers */
  .grid-2 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 768px) { .grid-2 { grid-template-columns: repeat(2, 1fr); } }
  
  .text-center { text-align: center; }
  .mt-1 { margin-top: 1rem; }
  .mb-1 { margin-bottom: 1rem; }
  
  .loading-spinner { 
    display: inline-block; 
    width: 20px; 
    height: 20px; 
    border: 2px solid var(--border-color); 
    border-top-color: var(--accent-primary); 
    border-radius: 50%; 
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin { to { transform: rotate(360deg); } }
  
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  
  /* Hint tooltip */
  .hint-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--border-color);
    color: var(--text-muted);
    font-size: 10px;
    font-weight: 700;
    cursor: help;
    margin-left: 4px;
  }
  
  /* Examples dropdown */
  .examples-toggle {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--accent-primary);
    font-size: 0.85rem;
    cursor: pointer;
    margin-top: 0.5rem;
  }
  
  .examples-toggle:hover { text-decoration: underline; }
  
  .examples-list {
    background: var(--bg-tertiary);
    border-radius: 6px;
    padding: 0.75rem;
    margin-top: 0.5rem;
    font-size: 0.85rem;
  }
  
  .examples-list ul { margin: 0; padding-left: 1.25rem; color: var(--text-secondary); }
  .examples-list li { margin-bottom: 0.25rem; }
`;

// Components
const StepsIndicator = ({ currentStep }) => (
  <div className="steps-indicator">
    {[{ num: 1, label: 'Выявление' }, { num: 2, label: 'Автоматизация' }, { num: 3, label: 'Оценка' }].map(step => (
      <div key={step.num} className={`step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}>
        <div className="step-number">{currentStep > step.num ? '✓' : step.num}</div>
        <div className="step-label">{step.label}</div>
      </div>
    ))}
  </div>
);

const CriteriaCheckbox = ({ criteria, checked, onChange }) => (
  <label className={`checkbox-item ${checked ? 'checked' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="checkbox-box">{checked && '✓'}</div>
    <div className="checkbox-content">
      <div className="checkbox-label">{criteria.label}</div>
      <div className="checkbox-hint">{criteria.hint}</div>
    </div>
  </label>
);

const CharCheckbox = ({ label, checked, onChange }) => (
  <label className={`char-item ${checked ? 'checked' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span>{label}</span>
  </label>
);

const ScoreBlock = ({ title, icon, criteria, selected, onToggle }) => {
  const score = selected.length;
  return (
    <div className="score-card">
      <div className="score-header">
        <div className="score-title"><span className="score-title-icon">{icon}</span>{title}</div>
        <div className="score-value">{score}/5</div>
      </div>
      <div className="checkbox-group">
        {criteria.map(c => (
          <CriteriaCheckbox
            key={c.id}
            criteria={c}
            checked={selected.includes(c.id)}
            onChange={() => onToggle(c.id)}
          />
        ))}
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

// Pages
const SessionPage = ({ db, onStartSession }) => {
  const [participant, setParticipant] = useState({ name: '', role: '', department: '', company: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = async () => {
    if (participant.name && participant.role && participant.department) {
      setIsSubmitting(true);
      const sessionId = await db.saveSession(participant);
      setIsSubmitting(false);
      onStartSession(sessionId, participant);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Начать сессию оценки</h1>
        <p className="page-subtitle">Заполните информацию для начала работы</p>
      </div>
      
      {!db.isConfigured && (
        <div className="alert alert-warning">
          <span>⚠️</span>
          <span>Локальный режим. Данные сохраняются только в браузере.</span>
        </div>
      )}
      
      {db.isConfigured && (
        <div className="alert alert-success">
          <span>✓</span>
          <span>Все ответы сохраняются в Google Таблицу</span>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">👤</div>
            <h2 className="card-title">Данные участника</h2>
          </div>
          
          <div className="form-group">
            <label className="form-label">ФИО *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Иванов Иван Иванович" 
              value={participant.name} 
              onChange={e => setParticipant({ ...participant, name: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Должность *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Специалист отдела..." 
              value={participant.role} 
              onChange={e => setParticipant({ ...participant, role: e.target.value })} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Отдел *</label>
            <select 
              className="form-input" 
              value={participant.department} 
              onChange={e => setParticipant({ ...participant, department: e.target.value })}
            >
              <option value="">Выберите отдел...</option>
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Компания</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="ООО «Компания»" 
              value={participant.company} 
              onChange={e => setParticipant({ ...participant, company: e.target.value })} 
            />
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleStart} 
            disabled={!participant.name || !participant.role || !participant.department || isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? <><span className="loading-spinner"></span> Сохранение...</> : 'Начать сессию →'}
          </button>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">📋</div>
            <h2 className="card-title">О методологии 3×5</h2>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Методология помогает системно выявить процессы для автоматизации с помощью ИИ и RPA.
          </p>
          
          {[
            { n: 1, t: 'Выявление процессов', d: 'Найдите «низковисящие фрукты» — частые, долгие, шаблонные задачи' },
            { n: 2, t: 'Тип автоматизации', d: 'Исключить → Упростить → Ускорить' },
            { n: 3, t: 'Приоритизация', d: 'Оцените по 15 критериям: Ценность + Реализуемость + AI-потенциал' }
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '12px', marginBottom: '0.75rem' }}>
              <span style={{ 
                background: 'var(--accent-primary)', 
                color: 'white',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '700',
                flexShrink: 0
              }}>{s.n}</span>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>{s.t}</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AssessmentPage = ({ db, sessionId, participant, onComplete }) => {
  const [step, setStep] = useState(1);
  const [processes, setProcesses] = useState([]);
  const [currentProcess, setCurrentProcess] = useState({
    name: '', comment: '', cohort: '',
    frequent: false, long: false, template: false,
    automationType: null, idea: '',
    valueCriteria: [], feasibilityCriteria: [], aiCriteria: []
  });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const isLowHangingFruit = (p) => [p.frequent, p.long, p.template].filter(Boolean).length >= 2;
  const getTotalScore = (p) => (p.valueCriteria?.length || 0) + (p.feasibilityCriteria?.length || 0) + (p.aiCriteria?.length || 0);
  const getPriorityClass = (score) => score >= 13 ? 'priority-high' : score >= 10 ? 'priority-medium' : 'priority-low';
  const getPriorityLabel = (score) => score >= 13 ? 'Делать сразу' : score >= 10 ? 'MVP' : 'Backlog';

  const toggleCriteria = (type, id) => {
    const key = `${type}Criteria`;
    const current = currentProcess[key] || [];
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    setCurrentProcess({ ...currentProcess, [key]: updated });
  };

  const updateProcessCriteria = (processId, type, id) => {
    setProcesses(processes.map(p => {
      if (p.id !== processId) return p;
      const key = `${type}Criteria`;
      const current = p[key] || [];
      const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      return { ...p, [key]: updated };
    }));
  };

  const addProcess = () => {
    if (currentProcess.name && currentProcess.cohort) {
      if (editingId) {
        setProcesses(processes.map(p => p.id === editingId ? { ...currentProcess, id: editingId } : p));
        setEditingId(null);
      } else {
        setProcesses([...processes, { ...currentProcess, id: Date.now() }]);
      }
      setCurrentProcess({
        name: '', comment: '', cohort: '',
        frequent: false, long: false, template: false,
        automationType: null, idea: '',
        valueCriteria: [], feasibilityCriteria: [], aiCriteria: []
      });
      setShowExamples(false);
    }
  };

  const finishSession = async () => {
    setIsSubmitting(true);
    const processesWithScores = lowHangingFruits.map(p => ({
      ...p,
      valueScore: p.valueCriteria?.length || 0,
      feasibilityScore: p.feasibilityCriteria?.length || 0,
      aiScore: p.aiCriteria?.length || 0,
      totalScore: getTotalScore(p)
    }));
    await db.saveProcesses(processesWithScores, sessionId, participant);
    setIsSubmitting(false);
    setIsCompleted(true);
  };

  const lowHangingFruits = processes.filter(isLowHangingFruit);

  if (isCompleted) {
    return (
      <div className="fade-in">
        <div className="card">
          <div className="success-screen">
            <div className="success-icon">🎉</div>
            <h2 className="success-title">Сессия завершена!</h2>
            <p className="success-text">Вы оценили {lowHangingFruits.length} процессов. Данные сохранены.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={onComplete}>Посмотреть дашборд</button>
              <button className="btn btn-secondary" onClick={() => { setIsCompleted(false); setStep(1); setProcesses([]); }}>Новая сессия</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Сессия оценки</h1>
        <p className="page-subtitle">{participant.name} • {participant.department}</p>
      </div>
      
      <StepsIndicator currentStep={step} />

      {/* Step 1: Process Identification */}
      {step === 1 && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon orange">🍎</div>
            <h2 className="card-title">Шаг 1: Выявление процессов</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Название процесса *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Например: Подготовка ежемесячного отчёта"
              value={currentProcess.name}
              onChange={e => setCurrentProcess({ ...currentProcess, name: e.target.value })}
            />
            <div className="examples-toggle" onClick={() => setShowExamples(!showExamples)}>
              {showExamples ? '▼' : '▶'} Примеры процессов
            </div>
            {showExamples && (
              <div className="examples-list">
                <ul>
                  {PROCESS_EXAMPLES.map((ex, i) => <li key={i}>{ex}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Когорта / Направление процесса *</label>
            <select
              className="form-input"
              value={currentProcess.cohort}
              onChange={e => setCurrentProcess({ ...currentProcess, cohort: e.target.value })}
            >
              <option value="">Выберите направление...</option>
              {COHORTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Характеристики процесса</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Отметьте минимум 2, чтобы процесс стал «низковисящим фруктом»
            </p>
            <div className="char-group">
              <CharCheckbox label="⏰ Часто" checked={currentProcess.frequent} onChange={e => setCurrentProcess({ ...currentProcess, frequent: e.target.checked })} />
              <CharCheckbox label="⏳ Долго" checked={currentProcess.long} onChange={e => setCurrentProcess({ ...currentProcess, long: e.target.checked })} />
              <CharCheckbox label="📋 По шаблону" checked={currentProcess.template} onChange={e => setCurrentProcess({ ...currentProcess, template: e.target.checked })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Комментарий</label>
            <textarea
              className="form-input"
              placeholder="Дополнительные пояснения..."
              value={currentProcess.comment}
              onChange={e => setCurrentProcess({ ...currentProcess, comment: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={addProcess} disabled={!currentProcess.name || !currentProcess.cohort}>
              {editingId ? 'Сохранить' : 'Добавить процесс'} +
            </button>
            {editingId && (
              <button className="btn btn-secondary" onClick={() => {
                setEditingId(null);
                setCurrentProcess({ name: '', comment: '', cohort: '', frequent: false, long: false, template: false, automationType: null, idea: '', valueCriteria: [], feasibilityCriteria: [], aiCriteria: [] });
              }}>Отмена</button>
            )}
          </div>

          {processes.length > 0 && (
            <>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
                Добавлено процессов: {processes.length} (из них «фруктов»: {lowHangingFruits.length})
              </h3>
              <div className="process-list">
                {processes.map(p => (
                  <div key={p.id} className="process-item">
                    <div className="process-header">
                      <div>
                        <div className="process-name">{p.name}</div>
                        <div className="process-tags">
                          {p.frequent && <span className="tag frequent">Часто</span>}
                          {p.long && <span className="tag long">Долго</span>}
                          {p.template && <span className="tag template">Шаблон</span>}
                          {isLowHangingFruit(p) && <span className="tag fruit">🍎 Фрукт</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {p.cohort}
                        </div>
                      </div>
                      <div className="process-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentProcess(p); setEditingId(p.id); }}>✏️</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setProcesses(processes.filter(x => x.id !== p.id))}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={lowHangingFruits.length === 0}>
              Далее ({lowHangingFruits.length} фруктов) →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Automation Type */}
      {step === 2 && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">⚡</div>
            <h2 className="card-title">Шаг 2: Тип автоматизации</h2>
          </div>

          {lowHangingFruits.map((p, idx) => (
            <div key={p.id} style={{ background: 'var(--bg-tertiary)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
                <span style={{ color: 'var(--accent-primary)', marginRight: '8px' }}>#{idx + 1}</span>
                {p.name}
              </h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.cohort}</div>

              <div className="automation-select">
                {Object.entries(AUTOMATION_EXAMPLES).map(([key, data]) => (
                  <div
                    key={key}
                    className={`automation-option ${key} ${p.automationType === key ? 'selected' : ''}`}
                    onClick={() => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, automationType: key } : pr))}
                  >
                    <div className="automation-header">
                      <span className="automation-icon">{data.icon}</span>
                      <span className="automation-title">{data.title}</span>
                    </div>
                    <div className="automation-desc">{data.description}</div>
                    <div className="automation-examples">
                      <div className="automation-examples-title">Примеры:</div>
                      <ul>
                        {data.examples.slice(0, 2).map((ex, i) => <li key={i}>{ex}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <label className="form-label">Ваша идея автоматизации</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Опишите, как можно автоматизировать..."
                  value={p.idea || ''}
                  onChange={e => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, idea: e.target.value } : pr))}
                />
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Назад</button>
            <button className="btn btn-primary" onClick={() => setStep(3)} disabled={lowHangingFruits.some(p => !p.automationType || !p.idea)}>
              Далее →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Prioritization */}
      {step === 3 && (
        <div className="card">
          <div className="card-header">
            <div className="card-icon green">📊</div>
            <h2 className="card-title">Шаг 3: Приоритизация (15 критериев)</h2>
          </div>

          {lowHangingFruits.map((p, idx) => (
            <div key={p.id} style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>
                    <span style={{ color: 'var(--accent-primary)', marginRight: '8px' }}>#{idx + 1}</span>
                    {p.name}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    💡 {p.idea}
                  </p>
                </div>
                <div className={getPriorityClass(getTotalScore(p))} style={{ padding: '8px 16px', borderRadius: '8px', fontWeight: '700' }}>
                  {getTotalScore(p)}/15 — {getPriorityLabel(getTotalScore(p))}
                </div>
              </div>

              <ScoreBlock
                title="Ценность для бизнеса"
                icon="💎"
                criteria={VALUE_CRITERIA}
                selected={p.valueCriteria || []}
                onToggle={(id) => updateProcessCriteria(p.id, 'value', id)}
              />

              <ScoreBlock
                title="Реализуемость"
                icon="🔧"
                criteria={FEASIBILITY_CRITERIA}
                selected={p.feasibilityCriteria || []}
                onToggle={(id) => updateProcessCriteria(p.id, 'feasibility', id)}
              />

              <ScoreBlock
                title="AI-потенциал"
                icon="🤖"
                criteria={AI_CRITERIA}
                selected={p.aiCriteria || []}
                onToggle={(id) => updateProcessCriteria(p.id, 'ai', id)}
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>← Назад</button>
            <button className="btn btn-primary" onClick={finishSession} disabled={isSubmitting}>
              {isSubmitting ? <><span className="loading-spinner"></span> Сохранение...</> : 'Завершить сессию ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ db }) => {
  const { processes, sessions, isLoading } = db.data;
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, title: '', processes: [] });

  const getTotalScore = (p) => (p.valueScore || 0) + (p.feasibilityScore || 0) + (p.aiScore || 0);
  const getPriorityClass = (score) => score >= 13 ? 'priority-high' : score >= 10 ? 'priority-medium' : 'priority-low';

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Дашборд</h1></div>
        <div className="card text-center" style={{ padding: '3rem' }}>
          <span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Загрузка данных...</p>
        </div>
      </div>
    );
  }

  const totalProcesses = processes.length;
  const avgScore = processes.length > 0 ? Math.round(processes.reduce((sum, p) => sum + getTotalScore(p), 0) / processes.length * 10) / 10 : 0;
  const highPriority = processes.filter(p => getTotalScore(p) >= 13);
  const mediumPriority = processes.filter(p => { const s = getTotalScore(p); return s >= 10 && s < 13; });

  const automationTypes = [
    { label: 'Исключить', value: processes.filter(p => p.automationType === 'exclude').length, color: 'var(--accent-red)' },
    { label: 'Упростить', value: processes.filter(p => p.automationType === 'simplify').length, color: 'var(--accent-orange)' },
    { label: 'Ускорить', value: processes.filter(p => p.automationType === 'accelerate').length, color: 'var(--accent-green)' }
  ];

  // Group by cohort
  const cohorts = {};
  processes.forEach(p => {
    const cohort = p.cohort || 'Не указано';
    if (!cohorts[cohort]) cohorts[cohort] = { processes: [], totalScore: 0 };
    cohorts[cohort].processes.push(p);
    cohorts[cohort].totalScore += getTotalScore(p);
  });

  const cohortData = Object.entries(cohorts).map(([name, data]) => ({
    name,
    count: data.processes.length,
    avgScore: data.processes.length > 0 ? Math.round(data.totalScore / data.processes.length * 10) / 10 : 0,
    highPriority: data.processes.filter(p => getTotalScore(p) >= 13).length,
    processes: data.processes
  })).sort((a, b) => b.count - a.count);

  const openModal = (title, procs) => {
    setModalData({ isOpen: true, title, processes: procs });
  };

  if (processes.length === 0) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Дашборд</h1></div>
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Нет данных</div>
            <p className="empty-state-text">Проведите сессию оценки, чтобы увидеть аналитику</p>
            {db.isConfigured && (
              <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => db.loadData()}>
                🔄 Обновить данные
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Аналитический дашборд</h1>
          <p className="page-subtitle">{sessions.length} сессий • {processes.length} процессов</p>
        </div>
        {db.isConfigured && (
          <button className="btn btn-secondary btn-sm" onClick={() => db.loadData()}>🔄 Обновить</button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => openModal('Все процессы', processes)}>
          <div className="stat-value blue">{totalProcesses}</div>
          <div className="stat-label">Всего процессов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value purple">{avgScore}</div>
          <div className="stat-label">Средний балл</div>
        </div>
        <div className="stat-card clickable" onClick={() => openModal('Высокий приоритет (13-15)', highPriority)}>
          <div className="stat-value green">{highPriority.length}</div>
          <div className="stat-label">Делать сразу</div>
        </div>
        <div className="stat-card clickable" onClick={() => openModal('Средний приоритет (10-12)', mediumPriority)}>
          <div className="stat-value orange">{mediumPriority.length}</div>
          <div className="stat-label">MVP</div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-title">⚡ Типы автоматизации</div>
        <div className="bar-chart">
          {automationTypes.map((item, i) => (
            <div key={i} className="bar-item">
              <div className="bar-label">{item.label}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ 
                  width: `${totalProcesses > 0 ? (item.value / totalProcesses) * 100 : 0}%`, 
                  background: item.color 
                }} />
              </div>
              <div className="bar-value">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-title">🏷️ Когорты процессов</div>
        <div className="cohort-grid">
          {cohortData.map((c, i) => (
            <div key={i} className="cohort-card" onClick={() => openModal(`Когорта: ${c.name}`, c.processes)}>
              <div className="cohort-header">
                <div className="cohort-name">{c.name}</div>
                <div className="cohort-count">{c.count} проц.</div>
              </div>
              <div className="cohort-stats">
                <div className="cohort-stat">
                  <div className="cohort-stat-value" style={{ color: 'var(--accent-primary)' }}>{c.avgScore}</div>
                  <div className="cohort-stat-label">Ср. балл</div>
                </div>
                <div className="cohort-stat">
                  <div className="cohort-stat-value" style={{ color: 'var(--accent-green)' }}>{c.highPriority}</div>
                  <div className="cohort-stat-label">Топ</div>
                </div>
                <div className="cohort-stat">
                  <div className="cohort-stat-value" style={{ color: 'var(--accent-purple)' }}>{Math.round(c.count / totalProcesses * 100)}%</div>
                  <div className="cohort-stat-label">Доля</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={modalData.isOpen} onClose={() => setModalData({ ...modalData, isOpen: false })} title={modalData.title}>
        {modalData.processes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет процессов</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Процесс</th>
                  <th>Когорта</th>
                  <th>Балл</th>
                </tr>
              </thead>
              <tbody>
                {modalData.processes.sort((a, b) => getTotalScore(b) - getTotalScore(a)).map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.cohort || '—'}</td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(getTotalScore(p))}`}>
                        {getTotalScore(p)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};

const DataPage = ({ db }) => {
  const { processes, isLoading } = db.data;
  const getTotalScore = (p) => (p.valueScore || 0) + (p.feasibilityScore || 0) + (p.aiScore || 0);
  const getPriorityClass = (score) => score >= 13 ? 'priority-high' : score >= 10 ? 'priority-medium' : 'priority-low';
  const sortedProcesses = [...processes].sort((a, b) => getTotalScore(b) - getTotalScore(a));

  const exportCSV = () => {
    const headers = ['Процесс', 'Участник', 'Отдел', 'Компания', 'Когорта', 'Тип', 'Идея', 'Ценность', 'Реализуемость', 'AI', 'Итого', 'Приоритет'];
    const rows = sortedProcesses.map(p => {
      const score = getTotalScore(p);
      return [
        p.name,
        p.participant?.name || '',
        p.participant?.department || '',
        p.participant?.company || '',
        p.cohort || '',
        p.automationType === 'exclude' ? 'Исключить' : p.automationType === 'simplify' ? 'Упростить' : 'Ускорить',
        p.idea,
        p.valueScore || 0,
        p.feasibilityScore || 0,
        p.aiScore || 0,
        score,
        score >= 13 ? 'Делать сразу' : score >= 10 ? 'MVP' : 'Backlog'
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `ai_assessment_${new Date().toISOString().split('T')[0]}.csv`; 
    a.click();
  };

  if (isLoading) {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">База данных</h1></div>
        <div className="card text-center" style={{ padding: '3rem' }}>
          <span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">База данных</h1>
          <p className="page-subtitle">{processes.length} процессов</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {db.isConfigured && <button className="btn btn-secondary btn-sm" onClick={() => db.loadData()}>🔄</button>}
          <button className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={processes.length === 0}>📥 CSV</button>
        </div>
      </div>

      {processes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <div className="empty-state-title">Нет данных</div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Процесс</th>
                  <th>Участник</th>
                  <th>Когорта</th>
                  <th>Тип</th>
                  <th>Балл</th>
                </tr>
              </thead>
              <tbody>
                {sortedProcesses.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.participant?.name || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.cohort || '—'}</td>
                    <td>{p.automationType === 'exclude' ? '🚫' : p.automationType === 'simplify' ? '✂️' : '🚀'}</td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(getTotalScore(p))}`}>
                        {getTotalScore(p)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App
export default function App() {
  const db = useDatabase();
  const [currentPage, setCurrentPage] = useState('session');
  const [activeSession, setActiveSession] = useState(null);
  const [participant, setParticipant] = useState(null);

  const handleStartSession = (sessionId, participantData) => {
    setActiveSession(sessionId);
    setParticipant(participantData);
    setCurrentPage('assessment');
  };

  const handleCompleteSession = () => {
    setActiveSession(null);
    setParticipant(null);
    setCurrentPage('dashboard');
    if (db.isConfigured) db.loadData();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <nav className="nav">
          <div className="nav-inner">
            <div className="logo">
              <div className="logo-icon">📊</div>
              <div className="logo-text">AI<span>Prioritet</span></div>
            </div>
            <div className="nav-links">
              <button 
                className={`nav-link ${currentPage === 'session' || currentPage === 'assessment' ? 'active' : ''}`} 
                onClick={() => { setCurrentPage('session'); setActiveSession(null); }}
              >
                Сессия
              </button>
              <button 
                className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('dashboard')}
              >
                Дашборд
              </button>
              <button 
                className={`nav-link ${currentPage === 'data' ? 'active' : ''}`} 
                onClick={() => setCurrentPage('data')}
              >
                Данные
              </button>
            </div>
          </div>
        </nav>
        
        <main className="main">
          {currentPage === 'session' && !activeSession && <SessionPage db={db} onStartSession={handleStartSession} />}
          {currentPage === 'assessment' && activeSession && <AssessmentPage db={db} sessionId={activeSession} participant={participant} onComplete={handleCompleteSession} />}
          {currentPage === 'dashboard' && <DashboardPage db={db} />}
          {currentPage === 'data' && <DataPage db={db} />}
        </main>
      </div>
    </>
  );
}
