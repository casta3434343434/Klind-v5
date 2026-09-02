<script>
  import FriendSearch from './social/FriendSearch.svelte';
  import FriendRequests from './social/FriendRequests.svelte';
  import FriendsList from './social/FriendsList.svelte';
  import FriendRequestsSent from './social/FriendRequestsSent.svelte';
  import Groups from './social/Groups.svelte';
  import Feed from './social/Feed.svelte';
  import Leaderboard from './social/Leaderboard.svelte';
  import FriendCompareChart from './social/FriendCompareChart.svelte';
  import RadarCompare from './social/RadarCompare.svelte';
  import Challenges from './social/Challenges.svelte';
</script>

<div class="main-header"><div><h1>Social</h1><p class="sub">Trova amici, gestisci richieste e guarda il feed.</p></div></div>

<div class="social-layout">
  <FriendSearch />
  <FriendRequests />
  <FriendsList />
  <FriendRequestsSent />
  <Groups />
  <Feed />
  <Leaderboard />
  <FriendCompareChart />
  <RadarCompare />
  <Challenges />
</div>
