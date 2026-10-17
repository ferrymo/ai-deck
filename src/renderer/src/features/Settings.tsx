import { ArrowDownToLine, Bell, Check, Clock3, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Settings as SettingsModel } from '../../../core/models';
import { Toggle } from '../components';
import { useDeck } from '../context';
export function Settings() {
  const { state, api, perform, busy } = useDeck();
  const [draft, setDraft] = useState(state.settings);
  useEffect(() => setDraft(state.settings), [state.settings]);
  const update = <K extends keyof SettingsModel>(key: K, value: SettingsModel[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.settings);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>偏好设置</h1>
          <p>按照你的节奏，安排工具的日常。</p>
        </div>
        <button
          type="button"
          className="button primary"
          disabled={!dirty || busy}
          onClick={() => void perform(() => api.saveSettings(draft), '偏好设置已保存')}
        >
          <Check size={16} />
          保存设置
        </button>
      </div>
      <div className="settings-layout">
        <section className="settings-section">
          <h2>
            <ArrowDownToLine size={18} />
            工具更新
          </h2>
          <div className="setting-row">
            <div>
              <h3>自动安装更新</h3>
              <p>尚未开放。安装适配器通过隔离验收后可启用。</p>
            </div>
            <Toggle
              label="自动安装更新"
              checked={false}
              disabled
              onChange={(value) => update('autoUpdate', value)}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>检查方式</h3>
              <p>只检查版本，不自动安装。</p>
            </div>
            <select
              aria-label="检查方式"
              value={draft.scheduleMode}
              onChange={(e) => update('scheduleMode', e.target.value as SettingsModel['scheduleMode'])}
            >
              <option value="continuous">持续检查</option>
              <option value="daily">每日定时</option>
            </select>
          </div>
          <div className="setting-row">
            <div>
              <h3>{draft.scheduleMode === 'continuous' ? '检查周期' : '每日检查时间'}</h3>
              <p>睡眠期间暂停，唤醒后补查。</p>
            </div>
            {draft.scheduleMode === 'continuous' ? (
              <select
                aria-label="检查周期"
                value={draft.intervalMinutes}
                onChange={(e) => update('intervalMinutes', Number(e.target.value))}
              >
                <option value={15}>每 15 分钟</option>
                <option value={30}>每 30 分钟</option>
                <option value={60}>每小时</option>
                <option value={360}>每 6 小时</option>
              </select>
            ) : (
              <input
                type="time"
                aria-label="每日检查时间"
                value={draft.dailyTime}
                onChange={(e) => update('dailyTime', e.target.value)}
              />
            )}
          </div>
          <div className="setting-row">
            <div>
              <h3>计划安装时段</h3>
              <p>为后续自动安装保留；当前不执行安装。</p>
            </div>
            <div className="time-range">
              <input
                type="time"
                aria-label="安装开始时间"
                value={draft.windowStart}
                onChange={(e) => update('windowStart', e.target.value)}
              />
              <span>—</span>
              <input
                type="time"
                aria-label="安装结束时间"
                value={draft.windowEnd}
                onChange={(e) => update('windowEnd', e.target.value)}
              />
            </div>
          </div>
          <div className="setting-row">
            <div>
              <h3>时区</h3>
              <p>每日检查与安装时段以此为准。</p>
            </div>
            <select
              aria-label="时区"
              value={draft.timezone}
              onChange={(e) => update('timezone', e.target.value)}
            >
              <option value="Asia/Hong_Kong">香港 · UTC+8</option>
              <option value="Asia/Shanghai">上海 · UTC+8</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </section>
        <section className="settings-section">
          <h2>
            <Monitor size={18} />
            外观
          </h2>
          <div className="setting-row">
            <div>
              <h3>界面主题</h3>
              <p>为不同光线选择舒适的工作环境。</p>
            </div>
            <div className="theme-options">
              {[
                ['light', '浅色', Sun],
                ['dark', '深色', Moon],
                ['system', '跟随系统', Monitor],
              ].map(([value, label, Icon]) => {
                const ThemeIcon = Icon as typeof Sun;
                return (
                  <button
                    type="button"
                    key={String(value)}
                    className={draft.theme === value ? 'selected' : ''}
                    aria-pressed={draft.theme === value}
                    onClick={() => update('theme', value as SettingsModel['theme'])}
                  >
                    <ThemeIcon size={16} />
                    {String(label)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <section className="settings-section">
          <h2>
            <Bell size={18} />
            后台与通知
          </h2>
          <div className="setting-row">
            <div>
              <h3>登录后启动 AI Deck</h3>
              <p>正式安装版可用。关闭窗口后继续在托盘运行。</p>
            </div>
            <Toggle
              label="登录后启动"
              checked={draft.launchAtLogin}
              onChange={(value) => update('launchAtLogin', value)}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>重要任务通知</h3>
              <p>后台检查失败时通知，未变化时保持安静。</p>
            </div>
            <Toggle
              label="重要任务通知"
              checked={draft.notifications}
              onChange={(value) => update('notifications', value)}
            />
          </div>
          <div className="setting-row">
            <div>
              <h3>客户端后台检查与下载</h3>
              <p>与工具更新独立；下载完成后由你点击安装。</p>
            </div>
            <Toggle
              label="客户端后台检查"
              checked={draft.selfUpdate}
              onChange={(value) => update('selfUpdate', value)}
            />
          </div>
        </section>
        <div className="settings-note">
          <ShieldCheck size={17} />
          <span>账号与凭证留在原工具。扫描结果、任务与备份仅保存在本机。</span>
        </div>
        <div className="settings-note">
          <Clock3 size={17} />
          <span>从托盘选择“退出 AI Deck”后，后台调度停止。</span>
        </div>
      </div>
    </>
  );
}
