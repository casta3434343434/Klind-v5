import { sb } from './supabaseClient.js';
import { app } from '../stores/appState.svelte.js';

export async function loadGroups() {
  const { data, error } = await sb.from('groups').select('id,name,owner_id,group_members(user_id, member:user_id(id,username,avatar_url,is_developer))');
  if (error) { console.error(error); app.groups = []; return; }
  app.groups = (data || []).map(g => ({
    id: g.id, name: g.name, owner_id: g.owner_id,
    members: (g.group_members || []).map(m => m.member).filter(Boolean)
  }));
}

export async function createGroup(name, memberIds) {
  const me = app.authUser.id;
  if (!name?.trim()) { alert('Inserisci un nome per il gruppo.'); return; }
  const { data: groupRow, error } = await sb.from('groups').insert({ name: name.trim(), owner_id: me }).select().single();
  if (error) { alert('Errore creazione gruppo: ' + error.message); return; }
  const uniqueIds = [...new Set([me, ...(memberIds || [])])];
  const rows = uniqueIds.map(userId => ({ group_id: groupRow.id, user_id: userId }));
  const { error: memErr } = await sb.from('group_members').insert(rows);
  if (memErr) {
    await sb.from('groups').delete().eq('id', groupRow.id);
    alert('Errore aggiunta membri: ' + memErr.message);
    return;
  }
  app.showCreateGroup = false;
  app.newGroupName = '';
  app.newGroupMemberIds = [];
  await loadGroups();
}

export async function deleteGroup(groupId) {
  const { error: membersError } = await sb.from('group_members').delete().eq('group_id', groupId);
  if (membersError) { alert('Errore eliminazione membri: ' + membersError.message); return; }
  const { error } = await sb.from('groups').delete().eq('id', groupId);
  if (error) { alert('Errore: ' + error.message); return; }
  if (app.activeGroupId === groupId) app.activeGroupId = null;
  await loadGroups();
}

export async function leaveGroup(groupId) {
  const { error } = await sb.from('group_members').delete().eq('group_id', groupId).eq('user_id', app.authUser.id);
  if (error) { alert('Errore: ' + error.message); return; }
  if (app.activeGroupId === groupId) app.activeGroupId = null;
  await loadGroups();
}

export async function removeGroupMember(groupId, userId) {
  const { error } = await sb.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) { alert('Errore: ' + error.message); return; }
  await loadGroups();
}
