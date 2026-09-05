<script lang="ts">
  import { page } from "$app/state";

  /**
   * The three modes of the app. Each is its own route so the auto-deploy
   * publishes them together.
   */
  const modes = [
    { href: "/", label: "Speak", title: "Turn what you say into full sentences" },
    { href: "/listen", label: "Listen", title: "Get replies to what your partner says" },
    { href: "/aphasiafier", label: "Aphasiafier", title: "Simulate aphasic speech" },
  ];

  const isActive = (href: string) =>
    href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href);
</script>

<!-- @component Brand plus a segmented control for switching between the app's modes. -->

<div class="flex items-center gap-3 sm:gap-5">
  <a href="/" class="text-lg font-bold tracking-tight whitespace-nowrap sm:text-2xl">Aphasia GPT</a>
  <nav aria-label="Mode" class="flex rounded-full bg-slate-100 p-1 text-sm">
    {#each modes as mode (mode.href)}
      <a
        href={mode.href}
        title={mode.title}
        aria-current={isActive(mode.href) ? "page" : undefined}
        class="rounded-full px-2.5 py-1 font-medium transition sm:px-3.5
          {isActive(mode.href)
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-900'}"
      >
        {mode.label}
      </a>
    {/each}
  </nav>
</div>
