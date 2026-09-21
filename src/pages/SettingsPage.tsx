import { useState, useRef } from 'react';
import { useApp } from '../app/AppContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  Settings, Download, Upload, Trash2, Moon, Sun, Monitor,
  Calendar, FileText, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import {
  exportFullAppJson, exportTasksCsv, clearAppData, parseAppJson,
} from '../services/storageService';
import {
  parseCalendarFile, buildImportPreview, importCalendarEvents,
} from '../services/calendarImportAdapter';
import { exportCalendarEvents } from '../services/calendarImportAdapter';
import type { ImportPreview, ImportDuplicateStrategy } from '../types';
import { cn } from '../utils/cn';

type ThemeMode = 'light' | 'dark' | 'system';

export function SettingsPage() {
  const { state, dispatch, showToast } = useApp();
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearConfirm2, setClearConfirm2] = useState(false);
  const [importCalPreview, setImportCalPreview] = useState<ImportPreview | null>(null);
  const [importStrategy, setImportStrategy] = useState<ImportDuplicateStrategy>('skip');
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; replaced: number; duplicated: number; failed: number } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const calendarFileRef = useRef<HTMLInputElement>(null);
  const appFileRef = useRef<HTMLInputElement>(null);

  // ---- Theme ----
  const handleTheme = (theme: ThemeMode) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme } });
    showToast('info', '主題已更新');
  };

  // ---- Week Starts On ----
  const handleWeekStart = (v: 0 | 1) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { weekStartsOn: v } });
    showToast('info', '週起始日已更新');
  };

  // ---- Export ----
  const handleExportApp = () => {
    const json = exportFullAppJson(state);
    downloadFile(json, `work-platform-${today()}.json`, 'application/json');
    showToast('success', '已匯出完整 App 資料');
  };

  const handleExportCalendar = () => {
    const json = exportCalendarEvents(state.calendarEvents);
    downloadFile(json, `calendar-${today()}.json`, 'application/json');
    showToast('success', '已匯出 Calendar 行程');
  };

  const handleExportTasks = () => {
    const csv = exportTasksCsv(state);
    downloadFile(csv, `tasks-${today()}.csv`, 'text/csv');
    showToast('success', '已匯出 Tasks CSV');
  };

  // ---- Import Calendar ----
  const handleCalendarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const raw = await file.text();
      const rawList = parseCalendarFile(raw);
      const preview = buildImportPreview(rawList, state.calendarEvents);
      setImportCalPreview(preview);
      setImportError(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '匯入失敗');
    }
  };

  const handleConfirmCalendarImport = () => {
    if (!importCalPreview) return;
    const { events, result } = importCalendarEvents(importCalPreview, state.calendarEvents, importStrategy);
    dispatch({ type: 'SET_EVENTS', payload: events });
    setImportResult(result);
    setImportCalPreview(null);
    showToast('success', `已匯入 ${result.imported + result.replaced + result.duplicated} 個行程`);
  };

  // ---- Import Full App ----
  const handleAppFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const raw = await file.text();
      const data = parseAppJson(raw);
      if (!data) throw new Error('這個檔案不是有效的 App 備份格式');
      dispatch({ type: 'RESTORE_DATA', payload: data });
      showToast('success', '已成功還原 App 資料');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '匯入失敗');
    }
  };

  // ---- Clear Data ----
  const handleClearData = () => {
    dispatch({ type: 'CLEAR_DATA' });
    clearAppData();
    setClearConfirm(false);
    setClearConfirm2(false);
    showToast('success', '所有資料已清除');
  };

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: '深色', icon: <Moon size={16} /> },
    { id: 'light', label: '淺色', icon: <Sun size={16} /> },
    { id: 'system', label: '系統', icon: <Monitor size={16} /> },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={20} className="text-gray-400" />
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      {/* Appearance */}
      <Section title="外觀">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">主題</label>
          <div className="flex gap-2">
            {themes.map(t => (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                  state.settings.theme === t.id
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">週起始日</label>
          <div className="flex gap-2">
            <button
              onClick={() => handleWeekStart(0)}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                state.settings.weekStartsOn === 0
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white',
              )}
            >
              星期日
            </button>
            <button
              onClick={() => handleWeekStart(1)}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                state.settings.weekStartsOn === 1
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white',
              )}
            >
              星期一
            </button>
          </div>
        </div>
      </Section>

      {/* Data Summary */}
      <Section title="資料總覽">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Calendar 行程', value: state.calendarEvents.length },
            { label: 'Tasks', value: state.tasks.length },
            { label: 'Projects', value: state.projects.length },
            { label: 'Contacts', value: state.contacts.length },
            { label: 'Notes', value: state.notes.length },
          ].map(item => (
            <div key={item.label} className="p-3 bg-gray-800 rounded-xl text-center">
              <div className="text-xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Export */}
      <Section title="匯出資料">
        <div className="space-y-2">
          <Button variant="secondary" onClick={handleExportApp} className="w-full justify-start gap-3">
            <Download size={16} />
            匯出完整 App JSON（所有資料備份）
          </Button>
          <Button variant="secondary" onClick={handleExportCalendar} className="w-full justify-start gap-3">
            <Calendar size={16} />
            匯出 Calendar 行程 JSON
          </Button>
          <Button variant="secondary" onClick={handleExportTasks} className="w-full justify-start gap-3">
            <FileText size={16} />
            匯出 Tasks CSV
          </Button>
        </div>
      </Section>

      {/* Import */}
      <Section title="匯入資料">
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-2">匯入完整 App JSON（覆蓋現有資料）</p>
            <Button
              variant="outline"
              onClick={() => appFileRef.current?.click()}
              className="w-full justify-start gap-3"
            >
              <Upload size={16} />
              選擇 App JSON 檔案
            </Button>
            <input ref={appFileRef} type="file" accept=".json" className="hidden" onChange={handleAppFileChange} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">匯入 Calendar JSON（支援原有 Calendar App 格式）</p>
            <Button
              variant="outline"
              onClick={() => calendarFileRef.current?.click()}
              className="w-full justify-start gap-3"
            >
              <Calendar size={16} />
              選擇 Calendar JSON 檔案
            </Button>
            <input ref={calendarFileRef} type="file" accept=".json" className="hidden" onChange={handleCalendarFileChange} />
          </div>
          {importError && (
            <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800 rounded-xl text-sm text-red-400">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              {importError}
            </div>
          )}
          {importResult && (
            <div className="flex items-start gap-2 p-3 bg-emerald-900/20 border border-emerald-800 rounded-xl text-sm text-emerald-400">
              <CheckCircle size={14} className="shrink-0 mt-0.5" />
              <div>
                匯入完成：新增 {importResult.imported}，更新 {importResult.replaced}，新ID {importResult.duplicated}，略過 {importResult.skipped}，失敗 {importResult.failed}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="危險操作" danger>
        <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-800/50 rounded-xl mb-3">
          <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400">清除資料前，建議先匯出備份，以防資料遺失。</p>
        </div>
        <Button
          variant="danger"
          onClick={() => setClearConfirm(true)}
          className="w-full justify-start gap-3"
        >
          <Trash2 size={16} />
          清除全部資料
        </Button>
      </Section>

      {/* About */}
      <Section title="關於">
        <div className="space-y-1 text-sm text-gray-500">
          <p><span className="text-gray-400">App 名稱：</span>Work Platform</p>
          <p><span className="text-gray-400">版本：</span>1.0.0 MVP</p>
          <p><span className="text-gray-400">資料儲存：</span>本地 localStorage</p>
          <p><span className="text-gray-400">Schema 版本：</span>{state.schemaVersion}</p>
        </div>
      </Section>

      {/* Calendar Import Preview Modal */}
      {importCalPreview && (
        <Modal isOpen onClose={() => setImportCalPreview(null)} title="匯入 Calendar 行程" size="lg">
          <div className="p-5 space-y-4">
            {/* Preview Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-800 rounded-xl text-center">
                <div className="text-xl font-bold text-white">{importCalPreview.total}</div>
                <div className="text-xs text-gray-500">總計</div>
              </div>
              <div className="p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-xl text-center">
                <div className="text-xl font-bold text-emerald-400">{importCalPreview.valid}</div>
                <div className="text-xs text-gray-500">有效</div>
              </div>
              <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-xl text-center">
                <div className="text-xl font-bold text-amber-400">{importCalPreview.duplicates}</div>
                <div className="text-xs text-gray-500">重複</div>
              </div>
              <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-xl text-center">
                <div className="text-xl font-bold text-red-400">{importCalPreview.invalid}</div>
                <div className="text-xs text-gray-500">無效</div>
              </div>
            </div>

            {/* Duplicate Strategy */}
            {importCalPreview.duplicates > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">重複資料處理方式</label>
                <div className="space-y-2">
                  {([
                    { value: 'skip', label: '略過', desc: '保留現有資料，略過重複' },
                    { value: 'replace', label: '覆蓋', desc: '以匯入資料覆蓋現有資料' },
                    { value: 'duplicate', label: '新建', desc: '建立新 ID，保留兩者' },
                  ] as { value: ImportDuplicateStrategy; label: string; desc: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setImportStrategy(opt.value)}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                        importStrategy === opt.value
                          ? 'bg-cyan-500/15 border-cyan-500/30'
                          : 'border-gray-700 hover:border-gray-600',
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0',
                        importStrategy === opt.value ? 'border-cyan-400 bg-cyan-400' : 'border-gray-600',
                      )} />
                      <div>
                        <p className="text-sm font-medium text-white">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview List */}
            <div>
              <p className="text-xs text-gray-500 mb-2">預覽（前 5 筆）</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {importCalPreview.events.slice(0, 5).map(e => (
                  <div
                    key={e.id}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg text-xs',
                      importCalPreview.duplicateIds.includes(e.id)
                        ? 'bg-amber-900/20 border border-amber-800/50'
                        : 'bg-gray-800',
                    )}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: e.color ?? '#3b82f6' }} />
                    <div>
                      <p className="text-white">{e.title}</p>
                      <p className="text-gray-500">{e.start.slice(0, 10)} {e.start.slice(11, 16)}</p>
                      {importCalPreview.duplicateIds.includes(e.id) && (
                        <Badge variant="warning">重複</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {importCalPreview.errors.length > 0 && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl">
                <p className="text-xs text-red-400 font-medium mb-1">匯入警告：</p>
                {importCalPreview.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400">{e}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setImportCalPreview(null)} className="flex-1">取消</Button>
              <Button onClick={handleConfirmCalendarImport} className="flex-1" disabled={importCalPreview.valid === 0}>
                確定匯入 {importCalPreview.valid} 個行程
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Confirm Step 1 */}
      <Modal isOpen={clearConfirm && !clearConfirm2} onClose={() => setClearConfirm(false)} title="清除全部資料" size="sm">
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800 rounded-xl">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              此操作將清除所有 Tasks、Calendar 行程、Projects、Contacts 及 Notes。
              <strong className="block mt-1">此操作不可撤銷！</strong>
            </p>
          </div>
          <p className="text-sm text-gray-400">建議先匯出備份再繼續。</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setClearConfirm(false)} className="flex-1">取消</Button>
            <Button variant="danger" onClick={() => setClearConfirm2(true)} className="flex-1">繼續</Button>
          </div>
        </div>
      </Modal>

      {/* Clear Confirm Step 2 */}
      <Modal isOpen={clearConfirm2} onClose={() => { setClearConfirm(false); setClearConfirm2(false); }} title="最後確認" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-white font-medium text-center">你確定要清除所有資料嗎？</p>
          <p className="text-xs text-gray-500 text-center">所有記錄將被永久刪除</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setClearConfirm(false); setClearConfirm2(false); }} className="flex-1">取消</Button>
            <Button variant="danger" onClick={handleClearData} className="flex-1">確定清除全部資料</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={cn('bg-gray-900 rounded-2xl border p-4 space-y-4', danger ? 'border-red-900/50' : 'border-gray-800')}>
      <h2 className={cn('text-sm font-semibold', danger ? 'text-red-400' : 'text-gray-300')}>{title}</h2>
      {children}
    </div>
  );
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
