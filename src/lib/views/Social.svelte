<script>
  import FriendsPanel from './social/FriendsPanel.svelte';
  import GroupsPanel from './social/GroupsPanel.svelte';
  import FeedPanel from './social/FeedPanel.svelte';
  import LeaderboardPanel from './social/LeaderboardPanel.svelte';
  import ComparePanel from './social/ComparePanel.svelte';
  import RadarPanel from './social/RadarPanel.svelte';
  import ChallengesPanel from './social/ChallengesPanel.svelte';
  import ConfirmDialog from './social/ConfirmDialog.svelte';
</script>

<div class="main-header"><div><h1>Social</h1><p class="sub">Trova amici, gestisci richieste e guarda il feed.</p></div></div>
<div class="social-layout">
  <FriendsPanel />
  <GroupsPanel />
  <FeedPanel />
  <LeaderboardPanel />
  <ComparePanel />
  <RadarPanel />
  <ChallengesPanel />
</div>
<ConfirmDialog />
