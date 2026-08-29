<script>
  import { DEVELOPER_USER_ID } from '../../constants.js';

  let { user } = $props();
  const show = $derived(!!user && (user.id === DEVELOPER_USER_ID || !!user.is_developer));
</script>

{#if show}<span class="developer-badge">Developer</span>{/if}
