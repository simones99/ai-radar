<script lang="ts">
  import Block from '../Block.svelte';
  import Throws from './Throws.svelte';
  let { broken = false, missing = null }: { broken?: boolean; missing?: string | null } = $props();
</script>

<Block title="Prova" note="Nota" {missing} cite={[{ t: 'Fonte: ' }, { t: 'OWID', href: 'https://ourworldindata.org' }]} table={{ cols: ['Anno', 'Valore'], rows: [['2025', 290]] }}>
  {#if broken}<Throws />{:else}<p>grafico ok</p>{/if}
</Block>
