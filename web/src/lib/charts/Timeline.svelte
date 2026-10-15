<script lang="ts">
  import { day, isoDay, monthYear, ym } from '../text/format';

  type Item = { date: string; title: string; text?: string; href?: string };
  let { items, today, label }: { items: Item[]; today: Date; label: string } = $props();

  const key = (d: string) => (d.length === 7 ? ym(today) : isoDay(today));
  const rows = $derived.by(() => {
    const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date));
    const out: ({ kind: 'item'; it: Item; cls: string } | { kind: 'today' })[] = [];
    let nextDone = false;
    for (const it of sorted) {
      const future = it.date >= key(it.date) && !(it.date.length === 10 && it.date === isoDay(today));
      if (future && !nextDone) {
        out.push({ kind: 'today' });
        out.push({ kind: 'item', it, cls: 'future next' });
        nextDone = true;
      } else out.push({ kind: 'item', it, cls: future ? 'future' : 'past' });
    }
    if (!nextDone) out.push({ kind: 'today' });
    return out;
  });
  const when = (d: string) => (d.length === 7 ? monthYear(d) : day(d));
</script>

<ol class="tl" aria-label={label}>
  {#each rows as r, i (i)}
    {#if r.kind === 'today'}
      <li class="today"><span class="when">oggi</span><span class="rail" aria-hidden="true"></span><span class="what">{day(isoDay(today))}</span></li>
    {:else}
      <li class={r.cls}>
        <span class="when">{when(r.it.date)}</span>
        <span class="rail" aria-hidden="true"></span>
        <span class="what">
          {#if r.it.href}<a href={r.it.href} target="_blank" rel="noopener">{r.it.title}</a>{:else}<b>{r.it.title}</b>{/if}
          {#if r.it.text}<span>{r.it.text}</span>{/if}
        </span>
      </li>
    {/if}
  {/each}
</ol>

<style>
  .tl { list-style: none; margin: 0; padding: 0; display: grid; }
  li { display: grid; grid-template-columns: 112px 24px minmax(0, 1fr); gap: 0 var(--s2); }
  @media (max-width: 560px) { li { grid-template-columns: 88px 16px minmax(0, 1fr); gap: 0 var(--s1); } }
  .when { font-weight: 600; font-size: 14px; padding-block: var(--s2); font-variant-numeric: tabular-nums; }
  .rail { position: relative; }
  .rail::before { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--line-2); }
  .rail::after { content: ""; position: absolute; left: calc(50% - 5px); top: 23px; width: 10px; height: 10px; border-radius: 50%; background: var(--fg); }
  .future .rail::after { background: var(--card); border: 1.5px solid var(--fg-3); }
  .next .rail::after { background: var(--accent); border: 0; box-shadow: 0 0 0 4px var(--accent-soft); }
  .next .when, .next .what a { color: var(--accent); }
  .what { padding-block: var(--s2); display: grid; gap: 4px; }
  .what a, .what b { font-weight: 600; }
  .what span { color: var(--fg-2); font-size: 14px; }
  .future:not(.next) .what a, .future:not(.next) .what b { font-weight: 500; color: var(--fg-2); }
  .today .when, .today .what { color: var(--fg-3); font-weight: 400; font-size: 12px; }
  .today .rail::after { width: 16px; height: 2px; border-radius: 1px; left: calc(50% - 8px); top: 27px; background: var(--fg-3); }
</style>
