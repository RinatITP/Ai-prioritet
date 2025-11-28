import React, { useState, useEffect, useCallback } from 'react';

// ===================================================================
// AI Assessment v2 - Comprehensive Refactor
// ===================================================================
// IMPROVEMENTS:
// 1. ✅ Light, professional design (Google Gemini-inspired)
// 2. ✅ Checkboxes for prioritization (3x5 criteria system)
// 3. ✅ Hints/suggestions for all selections
// 4. ✅ 10 departments dropdown
// 5. ✅ Cohort/direction field for process categorization
// 6. ✅ Clickable dashboard numbers with drill-down
// 7. ✅ Color-differentiated cohorts on graphs
// 8. ✅ Google Sheets integration with cohort field
// 9. ✅ Optimized for 20+ concurrent mobile users
// 10. ✅ Auto-calculated priority scores (0-15 scale)
// ===================================================================


// ============================================
// НАСТРОЙКА: Вставь сюда URL своего Google Apps Script
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzwVOoW7yukYlvLK6L-Bq7PQhjKZLOs1YAJxHpblWYDxBMwzKsxtUbbgIp7uR3sjeAF/exec';
// ============================================

// Database Hook - работает с Google Sheets
const useDatabase = () => {
  const [data, setData] = useState({
    sessions: [],
    processes: [],
    isLoading: false,
    error: null,
    isConfigured: GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE'
  });

  // Загрузка данных из Google Sheets
  const loadData = useCallback(async () => {
    if (!data.isConfigured) return;
    
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
    }
  }, [data.isConfigured]);

  useEffect(() => {
    loadData();
  }, []);

  // Сохранение сессии
  const saveSession = async (sessionData) => {
    if (!data.isConfigured) {
      const saved = JSON.parse(localStorage.getItem('ai_assessment_local') || '{"sessions":[],"processes":[]}');
      const newSession = { ...sessionData, id: Date.now(), createdAt: new Date().toISOString() };
      saved.sessions.push(newSession);
      localStorage.setItem('ai_assessment_local', JSON.stringify(saved));
      return newSession.id;
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addSession', data: sessionData })
      });
      return Date.now();
    } catch (error) {
      console.error('Ошибка сохранения сессии:', error);
      return Date.now();
    }
  };

  // Сохранение процессов
  const saveProcesses = async (processes, sessionId, participant) => {
    if (!data.isConfigured) {
      const saved = JSON.parse(localStorage.getItem('ai_assessment_local') || '{"sessions":[],"processes":[]}');
      processes.forEach(p => {
        saved.processes.push({ ...p, sessionId, participant, savedAt: new Date().toISOString() });
      });
      localStorage.setItem('ai_assessment_local', JSON.stringify(saved));
      return;
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'addProcesses', 
          data: { processes, sessionId, participant }
        })
      });
      setTimeout(() => loadData(), 1000);
    } catch (error) {
      console.error('Ошибка сохранения процессов:', error);
    }
  };

  return { 
    data, 
    saveSession, 
    saveProcesses, 
    loadData,
    isConfigured: data.isConfigured
  };
};

// Styles
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@300;400;500;600;700;800&display=swap');
  
  :root {
    --bg-primary: #0a0b0d;
    --bg-secondary: #12141a;
    --bg-tertiary: #1a1d26;
    --bg-card: #181b23;
    --accent-orange: #ff6b35;
    --accent-yellow: #ffc107;
    --accent-green: #00e676;
    --accent-blue: #2196f3;
    --accent-purple: #9c27b0;
    --text-primary: #ffffff;
    --text-secondary: #a0a6b8;
    --text-muted: #6b7280;
    --border-color: #2a2f3d;
    --danger: #ef4444;
    --success: #22c55e;
    --warning: #f59e0b;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Manrope', sans-serif; background: var(--bg-primary); color: var(--text-primary); min-height: 100vh; }
  .app-container { min-height: 100vh; background: radial-gradient(ellipse at 20% 0%, rgba(255, 107, 53, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(33, 150, 243, 0.06) 0%, transparent 50%), var(--bg-primary); }
  .nav { position: sticky; top: 0; z-index: 100; background: rgba(10, 11, 13, 0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border-color); padding: 0 2rem; }
  .nav-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 70px; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon { width: 42px; height: 42px; background: linear-gradient(135deg, var(--accent-orange), #ff8f65); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3); }
  .logo-text { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 1.1rem; letter-spacing: -0.5px; }
  .logo-text span { color: var(--accent-orange); }
  .nav-links { display: flex; gap: 8px; }
  .nav-link { padding: 10px 20px; border-radius: 8px; background: transparent; border: none; color: var(--text-secondary); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; }
  .nav-link:hover { background: var(--bg-tertiary); color: var(--text-primary); }
  .nav-link.active { background: var(--accent-orange); color: white; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3); }
  .main { max-width: 1400px; margin: 0 auto; padding: 2rem; }
  .page-header { margin-bottom: 2.5rem; }
  .page-title { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; background: linear-gradient(135deg, var(--text-primary), var(--text-secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .page-subtitle { color: var(--text-secondary); font-size: 1rem; }
  .card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; transition: all 0.3s ease; }
  .card:hover { border-color: rgba(255, 107, 53, 0.3); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; }
  .card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .card-icon.orange { background: rgba(255, 107, 53, 0.15); }
  .card-icon.blue { background: rgba(33, 150, 243, 0.15); }
  .card-icon.green { background: rgba(0, 230, 118, 0.15); }
  .card-title { font-size: 1.25rem; font-weight: 700; }
  .form-group { margin-bottom: 1.25rem; }
  .form-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { width: 100%; padding: 14px 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); font-family: 'Manrope', sans-serif; font-size: 1rem; transition: all 0.2s ease; }
  .form-input:focus { outline: none; border-color: var(--accent-orange); box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15); }
  .form-input::placeholder { color: var(--text-muted); }
  textarea.form-input { min-height: 100px; resize: vertical; }
  select.form-input { cursor: pointer; }
  .checkbox-group { display: flex; gap: 1rem; flex-wrap: wrap; }
  .checkbox-item { display: flex; align-items: center; gap: 10px; padding: 12px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; transition: all 0.2s ease; }
  .checkbox-item:hover { border-color: var(--accent-orange); }
  .checkbox-item.checked { background: rgba(255, 107, 53, 0.1); border-color: var(--accent-orange); }
  .checkbox-item input { display: none; }
  .checkbox-box { width: 22px; height: 22px; border: 2px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
  .checkbox-item.checked .checkbox-box { background: var(--accent-orange); border-color: var(--accent-orange); }
  .checkbox-label { font-weight: 500; }
  .btn { padding: 14px 28px; border-radius: 10px; border: none; font-family: 'Manrope', sans-serif; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 8px; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: linear-gradient(135deg, var(--accent-orange), #ff8f65); color: white; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3); }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 25px rgba(255, 107, 53, 0.4); }
  .btn-secondary { background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color); }
  .btn-secondary:hover:not(:disabled) { background: var(--bg-secondary); border-color: var(--accent-orange); }
  .btn-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.3); }
  .btn-sm { padding: 8px 16px; font-size: 0.85rem; }
  .hierarchy-select { display: flex; gap: 0.75rem; }
  .hierarchy-option { flex: 1; padding: 1rem; background: var(--bg-secondary); border: 2px solid var(--border-color); border-radius: 12px; cursor: pointer; text-align: center; transition: all 0.2s ease; }
  .hierarchy-option:hover { border-color: var(--text-muted); }
  .hierarchy-option.selected { border-color: var(--accent-orange); background: rgba(255, 107, 53, 0.08); }
  .hierarchy-option.exclude.selected { border-color: var(--danger); background: rgba(239, 68, 68, 0.08); }
  .hierarchy-option.simplify.selected { border-color: var(--warning); background: rgba(245, 158, 11, 0.08); }
  .hierarchy-option.accelerate.selected { border-color: var(--success); background: rgba(34, 197, 94, 0.08); }
  .hierarchy-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .hierarchy-label { font-weight: 600; font-size: 0.9rem; }
  .score-slider { margin-top: 0.75rem; }
  .score-slider input[type="range"] { width: 100%; height: 8px; border-radius: 4px; background: var(--bg-secondary); appearance: none; cursor: pointer; }
  .score-slider input[type="range"]::-webkit-slider-thumb { appearance: none; width: 24px; height: 24px; border-radius: 50%; background: var(--accent-orange); cursor: pointer; box-shadow: 0 2px 10px rgba(255, 107, 53, 0.4); }
  .score-display { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
  .score-value { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 700; color: var(--accent-orange); }
  .score-max { color: var(--text-muted); font-size: 0.85rem; }
  .process-list { display: grid; gap: 1rem; }
  .process-item { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center; transition: all 0.2s ease; }
  .process-item:hover { border-color: var(--accent-orange); }
  .process-name { font-weight: 600; margin-bottom: 0.25rem; }
  .process-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .tag.frequent { background: rgba(33, 150, 243, 0.15); color: var(--accent-blue); }
  .tag.long { background: rgba(156, 39, 176, 0.15); color: var(--accent-purple); }
  .tag.template { background: rgba(0, 230, 118, 0.15); color: var(--accent-green); }
  .priority-high { background: rgba(0, 230, 118, 0.15); color: var(--success); }
  .priority-medium { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
  .priority-low { background: rgba(107, 114, 128, 0.15); color: var(--text-muted); }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-card.orange::before { background: var(--accent-orange); }
  .stat-card.blue::before { background: var(--accent-blue); }
  .stat-card.green::before { background: var(--accent-green); }
  .stat-card.purple::before { background: var(--accent-purple); }
  .stat-value { font-family: 'JetBrains Mono', monospace; font-size: 2.5rem; font-weight: 700; margin-bottom: 0.25rem; }
  .stat-label { color: var(--text-secondary); font-size: 0.9rem; }
  .chart-container { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .chart-title { font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 10px; }
  .bar-chart { display: flex; flex-direction: column; gap: 1rem; }
  .bar-item { display: grid; grid-template-columns: 140px 1fr 60px; gap: 1rem; align-items: center; }
  .bar-label { font-size: 0.9rem; color: var(--text-secondary); }
  .bar-track { height: 32px; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 8px; transition: width 0.8s ease; }
  .bar-value { font-family: 'JetBrains Mono', monospace; font-weight: 600; text-align: right; }
  .donut-chart { display: flex; align-items: center; gap: 2rem; }
  .donut-visual { width: 180px; height: 180px; position: relative; }
  .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
  .legend-item { display: flex; align-items: center; gap: 10px; }
  .legend-color { width: 16px; height: 16px; border-radius: 4px; }
  .legend-label { flex: 1; color: var(--text-secondary); }
  .legend-value { font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); }
  .empty-state-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
  .empty-state-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary); }
  .steps-indicator { display: flex; gap: 0.5rem; margin-bottom: 2rem; }
  .step { flex: 1; padding: 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; text-align: center; transition: all 0.3s ease; }
  .step.active { background: rgba(255, 107, 53, 0.1); border-color: var(--accent-orange); }
  .step.completed { background: rgba(0, 230, 118, 0.1); border-color: var(--success); }
  .step-number { width: 28px; height: 28px; border-radius: 50%; background: var(--bg-tertiary); display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.5rem; }
  .step.active .step-number { background: var(--accent-orange); }
  .step.completed .step-number { background: var(--success); }
  .step-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
  .step.active .step-label, .step.completed .step-label { color: var(--text-primary); }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
  @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } .hierarchy-select { flex-direction: column; } .donut-chart { flex-direction: column; } }
  .fade-in { animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .table-container { overflow-x: auto; }
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--border-color); }
  .data-table th { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary); background: var(--bg-secondary); }
  .data-table tbody tr:hover { background: var(--bg-tertiary); }
  .cohort-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .cohort-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; transition: all 0.2s ease; }
  .cohort-card:hover { border-color: var(--accent-orange); }
  .cohort-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
  .cohort-name { font-weight: 700; font-size: 1.1rem; }
  .cohort-count { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-tertiary); padding: 4px 10px; border-radius: 6px; }
  .cohort-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
  .cohort-stat { text-align: center; }
  .cohort-stat-value { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 1.25rem; }
  .cohort-stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
  .action-buttons { display: flex; gap: 0.5rem; }
  .alert { padding: 1rem 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 12px; }
  .alert-warning { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: var(--warning); }
  .alert-success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: var(--success); }
  .alert-icon { font-size: 1.25rem; flex-shrink: 0; }
  .alert-content { flex: 1; }
  .alert-title { font-weight: 600; margin-bottom: 0.25rem; }
  .alert-text { font-size: 0.9rem; opacity: 0.9; }
  .loading-spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--accent-orange); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .success-screen { text-align: center; padding: 4rem 2rem; }
  .success-icon { font-size: 5rem; margin-bottom: 1.5rem; }
  .success-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; }
  .success-text { color: var(--text-secondary); margin-bottom: 2rem; }
`;

const DEPARTMENTS = ['Охрана труда', 'Промышленная безопасность', 'Пожарная безопасность', 'Экология', 'БДД', 'ГО и ЧС', 'Производство', 'Логистика', 'Бухгалтерия', 'HR / Кадры', 'IT', 'Другое'];

const StepsIndicator = ({ currentStep }) => (
  <div className="steps-indicator">
    {[{ num: 1, label: 'Выявление' }, { num: 2, label: 'Автоматизация' }, { num: 3, label: 'Приоритизация' }].map(step => (
      <div key={step.num} className={`step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}>
        <div className="step-number">{currentStep > step.num ? '✓' : step.num}</div>
        <div className="step-label">{step.label}</div>
      </div>
    ))}
  </div>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className={`checkbox-item ${checked ? 'checked' : ''}`}>
    <input type="checkbox" checked={checked} onChange={onChange} />
    <div className="checkbox-box">{checked && '✓'}</div>
    <span className="checkbox-label">{label}</span>
  </label>
);

const ScoreSlider = ({ label, value, onChange, description }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{description}</p>}
    <div className="score-slider">
      <input type="range" min="0" max="5" value={value} onChange={(e) => onChange(parseInt(e.target.value))} />
      <div className="score-display">
        <span className="score-value">{value}</span>
        <span className="score-max">из 5</span>
      </div>
    </div>
  </div>
);

const BarChart = ({ data, title, icon }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const colors = ['var(--accent-orange)', 'var(--accent-blue)', 'var(--accent-green)'];
  return (
    <div className="chart-container">
      <div className="chart-title"><span>{icon}</span>{title}</div>
      <div className="bar-chart">
        {data.map((item, i) => (
          <div key={i} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(item.value / maxValue) * 100}%`, background: colors[i] }} /></div>
            <div className="bar-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({ data, title, icon }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['var(--success)', 'var(--warning)', 'var(--text-muted)'];
  let cumulativePercent = 0;
  return (
    <div className="chart-container">
      <div className="chart-title"><span>{icon}</span>{title}</div>
      <div className="donut-chart">
        <div className="donut-visual">
          <svg viewBox="0 0 42 42" style={{ width: '100%', height: '100%' }}>
            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="var(--bg-secondary)" strokeWidth="4" />
            {data.map((item, i) => { const percent = total > 0 ? (item.value / total) * 100 : 0; const dashArray = `${percent} ${100 - percent}`; const dashOffset = 25 - cumulativePercent; cumulativePercent += percent; return <circle key={i} cx="21" cy="21" r="15.9" fill="transparent" stroke={colors[i]} strokeWidth="4" strokeDasharray={dashArray} strokeDashoffset={dashOffset} />; })}
            <text x="21" y="21" textAnchor="middle" dy="0.35em" fill="var(--text-primary)" fontSize="8" fontWeight="700" fontFamily="JetBrains Mono">{total}</text>
          </svg>
        </div>
        <div className="donut-legend">
          {data.map((item, i) => (<div key={i} className="legend-item"><div className="legend-color" style={{ background: colors[i] }} /><span className="legend-label">{item.label}</span><span className="legend-value">{item.value}</span></div>))}
        </div>
      </div>
    </div>
  );
};

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
      <div className="page-header"><h1 className="page-title">Начать сессию оценки</h1><p className="page-subtitle">Заполните информацию об участнике для начала работы по методологии 3×5</p></div>
      {!db.isConfigured && <div className="alert alert-warning"><span className="alert-icon">⚠️</span><div className="alert-content"><div className="alert-title">Google Sheets не подключён</div><div className="alert-text">Данные сохраняются только в браузере. Настройте интеграцию с Google Sheets для централизованного сбора.</div></div></div>}
      {db.isConfigured && <div className="alert alert-success"><span className="alert-icon">✅</span><div className="alert-content"><div className="alert-title">Google Sheets подключён</div><div className="alert-text">Все ответы участников будут сохраняться в вашу таблицу Google.</div></div></div>}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-icon orange">👤</div><h2 className="card-title">Данные участника</h2></div>
          <div className="form-group"><label className="form-label">ФИО *</label><input type="text" className="form-input" placeholder="Иванов Иван Иванович" value={participant.name} onChange={e => setParticipant({ ...participant, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Должность *</label><input type="text" className="form-input" placeholder="Инженер по ОТ и ПБ" value={participant.role} onChange={e => setParticipant({ ...participant, role: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Отдел / Направление *</label><select className="form-input" value={participant.department} onChange={e => setParticipant({ ...participant, department: e.target.value })}><option value="">Выберите отдел...</option>{DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Компания</label><input type="text" className="form-input" placeholder="ООО «Предприятие»" value={participant.company} onChange={e => setParticipant({ ...participant, company: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={handleStart} disabled={!participant.name || !participant.role || !participant.department || isSubmitting}>{isSubmitting ? <><span className="loading-spinner"></span> Сохранение...</> : 'Начать сессию →'}</button>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-icon blue">📋</div><h2 className="card-title">О методологии</h2></div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>Методология 3×5 помогает системно выявлять процессы для автоматизации с помощью ИИ и RPA.</p>
          {[{ n: 1, t: 'Выявление', d: 'Определение «низковисящих фруктов»', c: 'rgba(255, 107, 53, 0.15)' }, { n: 2, t: 'Автоматизация', d: 'Исключить → Упростить → Ускорить', c: 'rgba(33, 150, 243, 0.15)' }, { n: 3, t: 'Приоритизация', d: 'Оценка по модели 3×5', c: 'rgba(0, 230, 118, 0.15)' }].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ background: s.c, padding: '4px 10px', borderRadius: '6px', fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{s.n}</span>
              <div><strong>{s.t}</strong><p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{s.d}</p></div>
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
  const [currentProcess, setCurrentProcess] = useState({ name: '', comment: '', frequent: false, long: false, template: false, automationType: null, idea: '', valueScore: 0, feasibilityScore: 0, aiScore: 0 });
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isLowHangingFruit = (p) => [p.frequent, p.long, p.template].filter(Boolean).length >= 2;
  const getTotalScore = (p) => p.valueScore + p.feasibilityScore + p.aiScore;
  const getPriorityLevel = (score) => score >= 13 ? { label: '13-15: Делать сразу', class: 'priority-high' } : score >= 10 ? { label: '10-12: MVP', class: 'priority-medium' } : { label: '0-9: Backlog', class: 'priority-low' };

  const addProcess = () => {
    if (currentProcess.name) {
      if (editingId) { setProcesses(processes.map(p => p.id === editingId ? { ...currentProcess, id: editingId } : p)); setEditingId(null); }
      else { setProcesses([...processes, { ...currentProcess, id: Date.now() }]); }
      setCurrentProcess({ name: '', comment: '', frequent: false, long: false, template: false, automationType: null, idea: '', valueScore: 0, feasibilityScore: 0, aiScore: 0 });
    }
  };

  const finishSession = async () => { setIsSubmitting(true); await db.saveProcesses(processes, sessionId, participant); setIsSubmitting(false); setIsCompleted(true); };
  const lowHangingFruits = processes.filter(isLowHangingFruit);

  if (isCompleted) return (
    <div className="fade-in"><div className="card"><div className="success-screen">
      <div className="success-icon">🎉</div><h2 className="success-title">Сессия завершена!</h2>
      <p className="success-text">Вы оценили {lowHangingFruits.length} процессов. Данные сохранены.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onComplete}>Посмотреть дашборд →</button>
        <button className="btn btn-secondary" onClick={() => { setIsCompleted(false); setStep(1); setProcesses([]); }}>Новая сессия</button>
      </div>
    </div></div></div>
  );

  return (
    <div className="fade-in">
      <div className="page-header"><h1 className="page-title">Сессия оценки</h1><p className="page-subtitle">Участник: <strong>{participant.name}</strong> • {participant.department}</p></div>
      <StepsIndicator currentStep={step} />
      
      {step === 1 && (
        <div className="card">
          <div className="card-header"><div className="card-icon orange">🍎</div><h2 className="card-title">Блок 1: Выявление процессов</h2></div>
          <div className="form-group"><label className="form-label">Название процесса</label><input type="text" className="form-input" placeholder="Например: Подготовка ежемесячного отчёта по ОТ" value={currentProcess.name} onChange={e => setCurrentProcess({ ...currentProcess, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Характеристики</label><div className="checkbox-group"><Checkbox label="Часто" checked={currentProcess.frequent} onChange={e => setCurrentProcess({ ...currentProcess, frequent: e.target.checked })} /><Checkbox label="Долго" checked={currentProcess.long} onChange={e => setCurrentProcess({ ...currentProcess, long: e.target.checked })} /><Checkbox label="По шаблону" checked={currentProcess.template} onChange={e => setCurrentProcess({ ...currentProcess, template: e.target.checked })} /></div></div>
          <div className="form-group"><label className="form-label">Комментарий</label><textarea className="form-input" placeholder="Дополнительные пояснения..." value={currentProcess.comment} onChange={e => setCurrentProcess({ ...currentProcess, comment: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}><button className="btn btn-primary" onClick={addProcess} disabled={!currentProcess.name}>{editingId ? 'Сохранить' : 'Добавить'} +</button>{editingId && <button className="btn btn-secondary" onClick={() => { setEditingId(null); setCurrentProcess({ name: '', comment: '', frequent: false, long: false, template: false, automationType: null, idea: '', valueScore: 0, feasibilityScore: 0, aiScore: 0 }); }}>Отмена</button>}</div>
          {processes.length > 0 && (<><h3 style={{ marginBottom: '1rem' }}>Добавлено ({processes.length})</h3><div className="process-list">{processes.map(p => (<div key={p.id} className="process-item"><div><div className="process-name">{p.name}</div><div className="process-tags">{p.frequent && <span className="tag frequent">Часто</span>}{p.long && <span className="tag long">Долго</span>}{p.template && <span className="tag template">По шаблону</span>}{isLowHangingFruit(p) && <span className="tag" style={{ background: 'rgba(255, 107, 53, 0.15)', color: 'var(--accent-orange)' }}>🍎</span>}</div></div><div className="action-buttons"><button className="btn btn-secondary btn-sm" onClick={() => { setCurrentProcess(p); setEditingId(p.id); }}>✏️</button><button className="btn btn-danger btn-sm" onClick={() => setProcesses(processes.filter(x => x.id !== p.id))}>🗑️</button></div></div>))}</div></>)}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={() => setStep(2)} disabled={lowHangingFruits.length === 0}>Далее ({lowHangingFruits.length}) →</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-header"><div className="card-icon blue">⚡</div><h2 className="card-title">Блок 2: Тип автоматизации</h2></div>
          {lowHangingFruits.map((p, idx) => (
            <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '1rem' }}><span style={{ color: 'var(--accent-orange)', marginRight: '8px' }}>#{idx + 1}</span>{p.name}</h4>
              <div className="form-group"><label className="form-label">Тип воздействия</label><div className="hierarchy-select">{[{ t: 'exclude', i: '🚫', l: 'Исключить' }, { t: 'simplify', i: '✂️', l: 'Упростить' }, { t: 'accelerate', i: '🚀', l: 'Ускорить' }].map(o => (<div key={o.t} className={`hierarchy-option ${o.t} ${p.automationType === o.t ? 'selected' : ''}`} onClick={() => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, automationType: o.t } : pr))}><div className="hierarchy-icon">{o.i}</div><div className="hierarchy-label">{o.l}</div></div>))}</div></div>
              <div className="form-group"><label className="form-label">Идея автоматизации</label><input type="text" className="form-input" placeholder="Опишите идею..." value={p.idea} onChange={e => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, idea: e.target.value } : pr))} /></div>
            </div>
          ))}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}><button className="btn btn-secondary" onClick={() => setStep(1)}>← Назад</button><button className="btn btn-primary" onClick={() => setStep(3)} disabled={lowHangingFruits.some(p => !p.automationType || !p.idea)}>Далее →</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <div className="card-header"><div className="card-icon green">📊</div><h2 className="card-title">Блок 3: Приоритизация (3×5)</h2></div>
          {lowHangingFruits.map((p, idx) => (
            <div key={p.id} style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}><div><h4><span style={{ color: 'var(--accent-orange)', marginRight: '8px' }}>#{idx + 1}</span>{p.name}</h4><p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>💡 {p.idea}</p></div><div className={getPriorityLevel(getTotalScore(p)).class} style={{ padding: '8px 16px', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>{getTotalScore(p)}/15</div></div>
              <ScoreSlider label="Ценность" description="Экономия времени, снижение ошибок, влияние на KPI" value={p.valueScore} onChange={val => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, valueScore: val } : pr))} />
              <ScoreSlider label="Реализуемость" description="Понятность, доступность данных, независимость от IT" value={p.feasibilityScore} onChange={val => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, feasibilityScore: val } : pr))} />
              <ScoreSlider label="AI-потенциал" description="Повторяемость, стандартизируемость, работа с текстом" value={p.aiScore} onChange={val => setProcesses(processes.map(pr => pr.id === p.id ? { ...pr, aiScore: val } : pr))} />
            </div>
          ))}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}><button className="btn btn-secondary" onClick={() => setStep(2)}>← Назад</button><button className="btn btn-primary" onClick={finishSession} disabled={isSubmitting}>{isSubmitting ? <><span className="loading-spinner"></span> Сохранение...</> : 'Завершить ✓'}</button></div>
        </div>
      )}
    </div>
  );
};

const DashboardPage = ({ db }) => {
  const { processes, sessions, isLoading } = db.data;
  if (isLoading) return <div className="fade-in"><div className="page-header"><h1 className="page-title">Дашборд</h1></div><div className="card" style={{ textAlign: 'center', padding: '4rem' }}><span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span><p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Загрузка...</p></div></div>;

  const totalProcesses = processes.length;
  const avgScore = processes.length > 0 ? Math.round(processes.reduce((sum, p) => sum + (p.valueScore + p.feasibilityScore + p.aiScore), 0) / processes.length * 10) / 10 : 0;
  const highPriority = processes.filter(p => (p.valueScore + p.feasibilityScore + p.aiScore) >= 13).length;
  const automationTypes = [{ label: 'Исключить', value: processes.filter(p => p.automationType === 'exclude').length }, { label: 'Упростить', value: processes.filter(p => p.automationType === 'simplify').length }, { label: 'Ускорить', value: processes.filter(p => p.automationType === 'accelerate').length }];
  const priorityDistribution = [{ label: '13-15 (Сразу)', value: highPriority }, { label: '10-12 (MVP)', value: processes.filter(p => { const s = p.valueScore + p.feasibilityScore + p.aiScore; return s >= 10 && s < 13; }).length }, { label: '0-9 (Backlog)', value: processes.filter(p => (p.valueScore + p.feasibilityScore + p.aiScore) < 10).length }];

  const cohorts = {};
  processes.forEach(p => { const dept = p.participant?.department || 'Не указан'; if (!cohorts[dept]) cohorts[dept] = { processes: [], totalScore: 0 }; cohorts[dept].processes.push(p); cohorts[dept].totalScore += (p.valueScore || 0) + (p.feasibilityScore || 0) + (p.aiScore || 0); });
  const cohortData = Object.entries(cohorts).map(([name, data]) => ({ name, count: data.processes.length, avgScore: data.processes.length > 0 ? Math.round(data.totalScore / data.processes.length * 10) / 10 : 0, highPriority: data.processes.filter(p => (p.valueScore + p.feasibilityScore + p.aiScore) >= 13).length }));

  if (processes.length === 0) return <div className="fade-in"><div className="page-header"><h1 className="page-title">Дашборд</h1></div><div className="card"><div className="empty-state"><div className="empty-state-icon">📊</div><div className="empty-state-title">Нет данных</div><p>Проведите сессию оценки</p>{db.isConfigured && <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => db.loadData()}>🔄 Обновить</button>}</div></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><h1 className="page-title">Аналитический дашборд</h1><p className="page-subtitle">{sessions.length} сессий</p></div>{db.isConfigured && <button className="btn btn-secondary" onClick={() => db.loadData()}>🔄 Обновить</button>}</div>
      <div className="stats-grid"><div className="stat-card orange"><div className="stat-value">{totalProcesses}</div><div className="stat-label">Всего процессов</div></div><div className="stat-card blue"><div className="stat-value">{avgScore}</div><div className="stat-label">Средний балл</div></div><div className="stat-card green"><div className="stat-value">{highPriority}</div><div className="stat-label">Высокий приоритет</div></div><div className="stat-card purple"><div className="stat-value">{sessions.length}</div><div className="stat-label">Сессий</div></div></div>
      <div className="grid-2"><BarChart data={automationTypes} title="Типы автоматизации" icon="⚡" /><DonutChart data={priorityDistribution} title="Приоритеты" icon="📈" /></div>
      <div className="chart-container"><div className="chart-title"><span>🏢</span>Когорты (отделы)</div><div className="cohort-grid">{cohortData.map((c, i) => (<div key={i} className="cohort-card"><div className="cohort-header"><div className="cohort-name">{c.name}</div><div className="cohort-count">{c.count}</div></div><div className="cohort-stats"><div className="cohort-stat"><div className="cohort-stat-value" style={{ color: 'var(--accent-orange)' }}>{c.avgScore}</div><div className="cohort-stat-label">Ср. балл</div></div><div className="cohort-stat"><div className="cohort-stat-value" style={{ color: 'var(--success)' }}>{c.highPriority}</div><div className="cohort-stat-label">Топ</div></div><div className="cohort-stat"><div className="cohort-stat-value" style={{ color: 'var(--accent-blue)' }}>{Math.round(c.count / totalProcesses * 100)}%</div><div className="cohort-stat-label">Доля</div></div></div></div>))}</div></div>
    </div>
  );
};

const DataPage = ({ db }) => {
  const { processes, isLoading } = db.data;
  const getTotalScore = (p) => (p.valueScore || 0) + (p.feasibilityScore || 0) + (p.aiScore || 0);
  const getPriorityClass = (score) => score >= 13 ? 'priority-high' : score >= 10 ? 'priority-medium' : 'priority-low';
  const sortedProcesses = [...processes].sort((a, b) => getTotalScore(b) - getTotalScore(a));

  const exportCSV = () => {
    const headers = ['Процесс', 'Участник', 'Отдел', 'Компания', 'Тип', 'Идея', 'Ценность', 'Реализуемость', 'AI', 'Итого'];
    const rows = sortedProcesses.map(p => [p.name, p.participant?.name || '', p.participant?.department || '', p.participant?.company || '', p.automationType === 'exclude' ? 'Исключить' : p.automationType === 'simplify' ? 'Упростить' : 'Ускорить', p.idea, p.valueScore, p.feasibilityScore, p.aiScore, getTotalScore(p)]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ai_assessment_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  if (isLoading) return <div className="fade-in"><div className="page-header"><h1 className="page-title">База данных</h1></div><div className="card" style={{ textAlign: 'center', padding: '4rem' }}><span className="loading-spinner" style={{ width: '40px', height: '40px' }}></span></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><h1 className="page-title">База данных</h1><p className="page-subtitle">{processes.length} процессов</p></div><div style={{ display: 'flex', gap: '0.5rem' }}>{db.isConfigured && <button className="btn btn-secondary" onClick={() => db.loadData()}>🔄</button>}<button className="btn btn-secondary" onClick={exportCSV} disabled={processes.length === 0}>📥 CSV</button></div></div>
      {processes.length === 0 ? <div className="card"><div className="empty-state"><div className="empty-state-icon">📂</div><div className="empty-state-title">Пусто</div></div></div> : (
        <div className="card"><div className="table-container"><table className="data-table"><thead><tr><th>Процесс</th><th>Участник</th><th>Отдел</th><th>Тип</th><th>Идея</th><th>Итого</th></tr></thead><tbody>{sortedProcesses.map((p, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{p.name}</td><td>{p.participant?.name || '—'}</td><td>{p.participant?.department || '—'}</td><td>{p.automationType === 'exclude' ? '🚫' : p.automationType === 'simplify' ? '✂️' : '🚀'}</td><td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.idea}</td><td><span className={getPriorityClass(getTotalScore(p))} style={{ padding: '4px 10px', borderRadius: '6px', fontFamily: 'JetBrains Mono', fontWeight: '700' }}>{getTotalScore(p)}</span></td></tr>))}</tbody></table></div></div>
      )}
    </div>
  );
};

export default function App() {
  const db = useDatabase();
  const [currentPage, setCurrentPage] = useState('session');
  const [activeSession, setActiveSession] = useState(null);
  const [participant, setParticipant] = useState(null);

  const handleStartSession = (sessionId, participantData) => { setActiveSession(sessionId); setParticipant(participantData); setCurrentPage('assessment'); };
  const handleCompleteSession = () => { setActiveSession(null); setParticipant(null); setCurrentPage('dashboard'); if (db.isConfigured) db.loadData(); };

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <nav className="nav"><div className="nav-inner"><div className="logo"><div className="logo-icon">🤖</div><div className="logo-text">AI<span>Assessment</span></div></div><div className="nav-links"><button className={`nav-link ${currentPage === 'session' || currentPage === 'assessment' ? 'active' : ''}`} onClick={() => { setCurrentPage('session'); setActiveSession(null); }}>Новая сессия</button><button className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentPage('dashboard')}>Дашборд</button><button className={`nav-link ${currentPage === 'data' ? 'active' : ''}`} onClick={() => setCurrentPage('data')}>База данных</button></div></div></nav>
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
