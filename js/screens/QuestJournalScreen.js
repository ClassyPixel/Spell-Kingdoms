/**
 * QuestJournalScreen — shows active, completed, and failed quests.
 */
import EventBus from '../EventBus.js';
import GameState from '../GameState.js';
import { QUESTS } from '../Data.js';

const TABS = ['Active', 'Completed', 'Failed'];

const QuestJournalScreen = {
  _container: null,
  _questMap: {},
  _tab: 'Active',
  _selected: null,

  mount(container, params = {}) {
    this._container = container;
    this._questMap = {};
    QUESTS.forEach(q => { this._questMap[q.questId] = q; });
    this._render();
  },

  unmount() {
    this._container = null;
  },

  _render() {
    const c = this._container;
    c.innerHTML = '';

    const screen = document.createElement('div');
    screen.className = 'quest-journal-screen fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'screen-header';
    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => EventBus.emit('screen:pop'));
    const title = document.createElement('h2');
    title.textContent = '📜 Quest Journal';
    header.appendChild(backBtn);
    header.appendChild(title);
    screen.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'quest-journal-body';

    // List panel
    const listPanel = document.createElement('div');
    listPanel.className = 'quest-list-panel';

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'quest-list-tabs';
    TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'quest-tab' + (this._tab === tab ? ' active' : '');
      btn.textContent = tab;
      btn.addEventListener('click', () => {
        this._tab = tab;
        this._selected = null;
        this._refreshList(listEl, detailPanel);
        document.querySelectorAll('.quest-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
      });
      tabs.appendChild(btn);
    });
    listPanel.appendChild(tabs);

    const listEl = document.createElement('div');
    listEl.className = 'quest-list';
    listPanel.appendChild(listEl);

    // Detail panel
    const detailPanel = document.createElement('div');
    detailPanel.className = 'quest-detail-panel';
    detailPanel.innerHTML = '<p style="color:var(--color-text-dim)">Select a quest to view details.</p>';

    this._refreshList(listEl, detailPanel);

    body.appendChild(listPanel);
    body.appendChild(detailPanel);
    screen.appendChild(body);
    c.appendChild(screen);
  },

  _getQuestIds() {
    if (this._tab === 'Active')    return GameState.quests.active;
    if (this._tab === 'Completed') return GameState.quests.completed;
    return GameState.quests.failed;
  },

  _refreshList(listEl, detailPanel) {
    listEl.innerHTML = '';
    const ids = this._getQuestIds();
    if (!ids.length) {
      listEl.innerHTML = `<p style="color:var(--color-text-dim);font-size:0.85em;padding:12px">No quests here.</p>`;
      return;
    }
    ids.forEach(qId => {
      const quest = this._questMap[qId];
      const el = document.createElement('div');
      el.className = 'quest-entry' +
        (this._tab === 'Active' ? ' active-quest' : '') +
        (this._selected === qId ? ' selected' : '');
      el.innerHTML = `
        <div class="quest-entry-title">${quest?.title ?? qId}</div>
        <div class="quest-entry-type">${quest?.type === 'main' ? 'Main Quest' : 'Side Quest'}</div>
      `;
      el.addEventListener('click', () => {
        this._selected = qId;
        this._renderDetail(detailPanel, quest);
        document.querySelectorAll('.quest-entry').forEach(e => e.classList.remove('selected'));
        el.classList.add('selected');
      });
      listEl.appendChild(el);
    });
  },

  _renderDetail(panel, quest) {
    if (!quest) return;

    const completedObjectives = GameState.progression.gameFlags;

    panel.innerHTML = `
      <h3>${quest.title ?? quest.questId}</h3>
      <p>${quest.description ?? ''}</p>
      <div class="quest-objectives">
        <h4>Objectives</h4>
        ${(quest.objectives ?? []).map(obj => {
          const done = completedObjectives[`obj_done_${obj.id}`] ?? false;
          return `<div class="objective-item ${done ? 'done' : ''}">
            <span class="${done ? 'objective-check' : 'objective-pending'}">${done ? '✓' : '○'}</span>
            <span>${obj.description ?? obj.id}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="quest-rewards" style="margin-top:16px">
        <h4>Rewards</h4>
        ${quest.rewards?.gold ? `<div class="objective-item"><span style="color:var(--color-gold)">💰</span><span>${quest.rewards.gold} gold</span></div>` : ''}
        ${(quest.rewards?.cards ?? []).map(cid => `<div class="objective-item"><span>🃏</span><span>${cid}</span></div>`).join('')}
      </div>
    `;
  },

  update(dt) {},
};

export default QuestJournalScreen;
