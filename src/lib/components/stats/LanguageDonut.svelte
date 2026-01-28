<script lang="ts">
	interface LanguageStat {
		language: string;
		count: number;
	}

	interface Props {
		data: LanguageStat[];
	}

	let { data }: Props = $props();

	// Language colors (matching common syntax highlighting themes)
	const languageColors: Record<string, string> = {
		javascript: '#f7df1e',
		typescript: '#3178c6',
		python: '#3776ab',
		java: '#b07219',
		csharp: '#178600',
		cpp: '#f34b7d',
		c: '#555555',
		go: '#00add8',
		rust: '#dea584',
		ruby: '#701516',
		php: '#4f5d95',
		swift: '#f05138',
		kotlin: '#a97bff',
		html: '#e34c26',
		css: '#563d7c',
		sql: '#e38c00',
		bash: '#89e051',
		json: '#292929',
		yaml: '#cb171e',
		markdown: '#083fa1'
	};

	function getLanguageColor(lang: string): string {
		return languageColors[lang.toLowerCase()] || '#6b7280';
	}

	// Process data: take top 5, group rest as "Autres"
	const processedData = $derived.by(() => {
		if (data.length === 0) return [];

		const sorted = [...data].sort((a, b) => b.count - a.count);
		const top5 = sorted.slice(0, 5);
		const rest = sorted.slice(5);

		if (rest.length > 0) {
			const othersCount = rest.reduce((sum, item) => sum + item.count, 0);
			top5.push({ language: 'Autres', count: othersCount });
		}

		return top5;
	});

	const total = $derived(processedData.reduce((sum, item) => sum + item.count, 0));

	// SVG donut calculations
	const size = 100;
	const strokeWidth = 20;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	// Calculate segments
	const segments = $derived.by(() => {
		if (processedData.length === 0) return [];

		let currentOffset = 0;
		return processedData.map((item) => {
			const percentage = total > 0 ? item.count / total : 0;
			const dashLength = percentage * circumference;
			const dashOffset = -currentOffset;
			currentOffset += dashLength;

			return {
				...item,
				color: item.language === 'Autres' ? '#6b7280' : getLanguageColor(item.language),
				dashArray: `${dashLength} ${circumference - dashLength}`,
				dashOffset
			};
		});
	});
</script>

{#if data.length === 0}
	<div class="text-center py-4 text-muted text-[11px]">Aucun bloc code</div>
{:else}
	<div class="flex items-center gap-4">
		<!-- Donut Chart -->
		<div class="relative flex-shrink-0">
			<svg width={size} height={size} viewBox="0 0 {size} {size}">
				<!-- Background circle -->
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="var(--color-border)"
					stroke-width={strokeWidth}
				/>

				<!-- Segments -->
				{#each segments as segment}
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={segment.color}
						stroke-width={strokeWidth}
						stroke-dasharray={segment.dashArray}
						stroke-dashoffset={segment.dashOffset}
						transform="rotate(-90 {size / 2} {size / 2})"
						class="transition-all duration-300"
					/>
				{/each}
			</svg>

			<!-- Center text -->
			<div class="absolute inset-0 flex flex-col items-center justify-center">
				<span class="text-lg font-semibold text-foreground leading-none">{total}</span>
				<span class="text-[9px] text-muted">blocs</span>
			</div>
		</div>

		<!-- Legend -->
		<div class="flex-1 space-y-1 min-w-0">
			{#each segments as segment}
				<div class="flex items-center gap-2 text-[10px]">
					<span
						class="w-2 h-2 rounded-sm flex-shrink-0"
						style="background-color: {segment.color}"
					></span>
					<span class="text-foreground truncate">{segment.language}</span>
					<span class="text-muted ml-auto">{segment.count}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
