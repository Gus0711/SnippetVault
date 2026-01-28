<script lang="ts">
	interface ActivityDay {
		day: string;
		count: number;
	}

	interface Props {
		data: ActivityDay[];
	}

	let { data }: Props = $props();

	// Build a map of date -> count
	const activityMap = $derived(new Map(data.map((d) => [d.day, d.count])));

	// Generate 365 days grid (52 weeks + partial)
	const today = new Date();
	const oneYearAgo = new Date(today);
	oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

	// Align to start of week (Sunday = 0)
	const startDate = new Date(oneYearAgo);
	startDate.setDate(startDate.getDate() - startDate.getDay());

	// Generate all days from startDate to today
	const days = $derived.by(() => {
		const result: { date: Date; dateStr: string; count: number; weekIndex: number; dayIndex: number }[] = [];
		const current = new Date(startDate);
		let weekIndex = 0;
		let dayIndex = current.getDay();

		while (current <= today) {
			const dateStr = current.toISOString().split('T')[0];
			result.push({
				date: new Date(current),
				dateStr,
				count: activityMap.get(dateStr) || 0,
				weekIndex,
				dayIndex
			});

			current.setDate(current.getDate() + 1);
			dayIndex = (dayIndex + 1) % 7;
			if (dayIndex === 0) weekIndex++;
		}

		return result;
	});

	const weeks = $derived(days.length > 0 ? Math.max(...days.map((d) => d.weekIndex)) + 1 : 0);

	// Month labels
	const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

	const monthLabels = $derived.by(() => {
		const labels: { month: string; weekIndex: number }[] = [];
		let lastMonth = -1;

		for (const day of days) {
			const month = day.date.getMonth();
			if (month !== lastMonth && day.dayIndex === 0) {
				labels.push({ month: monthNames[month], weekIndex: day.weekIndex });
				lastMonth = month;
			}
		}

		return labels;
	});

	// Day labels
	const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

	// Level calculation
	function getLevel(count: number): number {
		if (count === 0) return 0;
		if (count === 1) return 1;
		if (count <= 3) return 2;
		if (count <= 6) return 3;
		return 4;
	}

	// Tooltip state
	let tooltip = $state<{ x: number; y: number; text: string } | null>(null);

	function showTooltip(event: MouseEvent, day: { dateStr: string; count: number }) {
		const target = event.target as SVGElement;
		const rect = target.getBoundingClientRect();
		const container = target.closest('.heatmap-container')?.getBoundingClientRect();
		if (!container) return;

		const date = new Date(day.dateStr);
		const formatted = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		const text = day.count === 0 ? `Aucun snippet le ${formatted}` : `${day.count} snippet${day.count > 1 ? 's' : ''} le ${formatted}`;

		tooltip = {
			x: rect.left - container.left + rect.width / 2,
			y: rect.top - container.top - 8,
			text
		};
	}

	function hideTooltip() {
		tooltip = null;
	}

	// Cell size and gap
	const cellSize = 10;
	const gap = 2;
	const labelWidth = 16;
	const labelHeight = 14;
</script>

<div class="heatmap-container relative overflow-x-auto">
	<!-- Month labels -->
	<svg
		width={labelWidth + weeks * (cellSize + gap)}
		height={labelHeight}
		class="text-[9px] text-muted fill-current"
	>
		{#each monthLabels as { month, weekIndex }}
			<text x={labelWidth + weekIndex * (cellSize + gap)} y={10}>{month}</text>
		{/each}
	</svg>

	<!-- Grid with day labels -->
	<div class="flex">
		<!-- Day labels -->
		<svg width={labelWidth} height={7 * (cellSize + gap)} class="text-[9px] text-muted fill-current">
			{#each [1, 3, 5] as dayIdx}
				<text x={0} y={dayIdx * (cellSize + gap) + cellSize - 2}>{dayLabels[dayIdx]}</text>
			{/each}
		</svg>

		<!-- Heatmap grid -->
		<svg width={weeks * (cellSize + gap)} height={7 * (cellSize + gap)}>
			{#each days as day}
				<rect
					x={day.weekIndex * (cellSize + gap)}
					y={day.dayIndex * (cellSize + gap)}
					width={cellSize}
					height={cellSize}
					rx={2}
					class="heatmap-cell level-{getLevel(day.count)}"
					onmouseenter={(e) => showTooltip(e, day)}
					onmouseleave={hideTooltip}
				/>
			{/each}
		</svg>
	</div>

	<!-- Tooltip -->
	{#if tooltip}
		<div
			class="absolute z-10 px-2 py-1 text-[10px] bg-foreground text-background rounded shadow-lg whitespace-nowrap pointer-events-none"
			style="left: {tooltip.x}px; top: {tooltip.y}px; transform: translate(-50%, -100%);"
		>
			{tooltip.text}
		</div>
	{/if}

	<!-- Legend -->
	<div class="flex items-center justify-end gap-1 mt-2 text-[9px] text-muted">
		<span>Moins</span>
		{#each [0, 1, 2, 3, 4] as level}
			<svg width={cellSize} height={cellSize}>
				<rect width={cellSize} height={cellSize} rx={2} class="heatmap-cell level-{level}" />
			</svg>
		{/each}
		<span>Plus</span>
	</div>
</div>

<style>
	.heatmap-cell {
		transition: opacity 0.1s;
	}

	.heatmap-cell:hover {
		opacity: 0.8;
	}

	.level-0 {
		fill: var(--color-surface);
	}

	.level-1 {
		fill: color-mix(in srgb, var(--color-accent) 25%, var(--color-surface));
	}

	.level-2 {
		fill: color-mix(in srgb, var(--color-accent) 50%, var(--color-surface));
	}

	.level-3 {
		fill: color-mix(in srgb, var(--color-accent) 75%, var(--color-surface));
	}

	.level-4 {
		fill: var(--color-accent);
	}
</style>
