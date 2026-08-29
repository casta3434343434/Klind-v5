<script>
  import { app } from '../../stores/appState.svelte.js';
  import { DISCIPLINE_LABELS, SESSION_MOODS } from '../../constants.js';
  import { sessionGrade, displaySessionGrade } from '../../utils/grades.js';
  import { isFeedRecord } from '../../utils/social.js';
  import { toggleReaction, addComment } from '../../api/social.js';
  import DeveloperBadge from './DeveloperBadge.svelte';

  let { r } = $props();

  const grade = $derived(sessionGrade(r, r.disciplina));
  const friend = $derived(app.friends.find(f => f.id === r.authorId));
  const reactions = $derived(app.feedReactions[r.id] || []);
  const comments = $derived(app.feedComments[r.id] || []);
  const myReaction = $derived(reactions.find(x => x.user_id === app.authUser?.id));
  const isRecord = $derived(isFeedRecord(r, app.friendFeed));
  const mood = $derived(SESSION_MOODS.find(m => m.id === r.mood));

  let pickerOpen = $state(false);
  let commentsOpen = $state(false);
  let commentText = $state('');
  let busy = $state(false);

  async function react(reactionType) {
    busy = true;
    try { await toggleReaction(r.id, r.authorId, reactionType); pickerOpen = false; } finally { busy = false; }
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    busy = true;
    try { await addComment(r.id, r.authorId, commentText); commentText = ''; } finally { busy = false; }
  }
</script>

<div class="feed-item {isRecord ? 'feed-item-record' : ''}">
  <div class="feed-row">
    <span class="avatar">{#if friend?.avatar_url}<img class="avatar" src={friend.avatar_url} alt="">{/if}</span>
    <div class="feed-main">
      <div class="feed-line1">
        <b>{r.authorName}</b><DeveloperBadge user={friend} />
        <span class="chip chip-{r.disciplina}">{DISCIPLINE_LABELS[r.disciplina] || r.disciplina}</span>
        {#if grade}<b>{displaySessionGrade(r, grade)}</b>{/if}
        {#if isRecord}🏆{/if}
      </div>
      <div class="sub" style="font-size:12px;">{r.data.split('-').reverse().join('/')}{#if mood} · {mood.label}{/if}</div>
    </div>
    {#if mood}<img src={mood.img} alt={mood.label} title={mood.label} style="width:38px;height:38px;border-radius:8px;object-fit:cover;flex-shrink:0;">{/if}
  </div>
  <div class="feed-actions-mini" style="position:relative;">
    <button class="feed-icon-btn {myReaction ? 'active' : ''}" onclick={() => pickerOpen = !pickerOpen}>
      {#if myReaction}<img src={SESSION_MOODS.find(m => m.id === myReaction.reaction_type)?.img || SESSION_MOODS[0].img} alt="" style="width:18px;height:18px;border-radius:4px;vertical-align:middle;object-fit:cover;">{:else}＋ reagisci{/if}
      {#if reactions.length} {reactions.length}{/if}
    </button>
    <button class="feed-icon-btn" onclick={() => commentsOpen = !commentsOpen}>💬{#if comments.length} {comments.length}{/if}</button>
    {#if pickerOpen}
      <div class="reaction-picker">
        {#each SESSION_MOODS as m (m.id)}
          <button type="button" class="reaction-opt" title={m.label} disabled={busy} onclick={() => react(m.id)}><img src={m.img} alt={m.label}></button>
        {/each}
      </div>
    {/if}
  </div>
  {#if commentsOpen}
    <div class="feed-comments">
      {#if comments.length}
        {#each comments as c (c.id)}
          <div class="comment-item"><b>{app.friends.find(f => f.id === c.user_id)?.username || (c.user_id === app.authUser?.id ? 'Tu' : 'Utente')}:</b> {c.content}</div>
        {/each}
      {:else}
        <div class="comment-item sub">Ancora nessun commento.</div>
      {/if}
      <div class="field-row" style="margin-top:10px;align-items:end;">
        <div class="field" style="margin-bottom:0;">
          <input type="text" placeholder="Scrivi un commento..." maxlength="500" bind:value={commentText} onkeydown={(e) => e.key === 'Enter' && submitComment()}>
        </div>
        <button class="btn btn-sm btn-primary" disabled={busy} onclick={submitComment}>Invia</button>
      </div>
    </div>
  {/if}
</div>
