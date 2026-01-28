<script lang="ts">
	import {
		Code2,
		FolderTree,
		Search,
		Share2,
		Download,
		Lock,
		Server,
		Zap,
		Github,
		Terminal,
		Blocks,
		Tags,
		FileCode,
		Database,
		Cpu,
		ChevronRight,
		ExternalLink,
		Star,
		BookOpen,
		Globe,
		Cloud,
		Mail,
		CheckCircle,
		Languages,
		Bot,
		Sparkles,
		MessageSquare,
		Plug,
		BrainCircuit
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Language state
	let lang = $state(data.detectedLang || 'en');

	// Toggle language
	function toggleLang() {
		lang = lang === 'fr' ? 'en' : 'fr';
	}

	// Survey state
	let surveyEmail = $state('');
	let surveySubmitted = $state(false);
	let surveyLoading = $state(false);

	// Lightbox state
	let lightboxOpen = $state(false);
	let lightboxSrc = $state('');

	async function submitSurvey(e: Event) {
		e.preventDefault();
		if (!surveyEmail) return;

		surveyLoading = true;
		// Simulate submission (in production, send to a real endpoint)
		await new Promise(r => setTimeout(r, 1000));
		surveySubmitted = true;
		surveyLoading = false;
	}

	// Translations
	const t = $derived({
		// Navigation
		features: lang === 'fr' ? 'Fonctionnalites' : 'Features',
		selfHosted: lang === 'fr' ? 'Auto-heberge' : 'Self-Hosted',
		api: 'API',
		docs: 'Documentation',
		getStarted: lang === 'fr' ? 'Commencer' : 'Get Started',

		// Hero
		badge: lang === 'fr' ? 'Open Source & Auto-heberge' : 'Open Source & Self-Hosted',
		heroTitle1: lang === 'fr' ? 'Gerez vos snippets' : 'Manage your snippets',
		heroTitle2: lang === 'fr' ? 'comme un pro' : 'like a pro',
		heroDesc: lang === 'fr'
			? 'SnippetVault est un gestionnaire de snippets de code auto-heberge avec un editeur de blocs puissant, une recherche full-text instantanee et des options de partage flexibles.'
			: 'SnippetVault is a self-hosted code snippet manager with a powerful block editor, instant full-text search, and flexible sharing options.',
		deployNow: lang === 'fr' ? 'Deployer maintenant' : 'Deploy Now',
		viewOnGithub: lang === 'fr' ? 'Voir sur GitHub' : 'View on GitHub',
		openSource: 'Open Source',
		dockerReady: 'Docker Ready',
		private: lang === 'fr' ? '100% Prive' : '100% Private',

		// Features section
		featuresTitle: lang === 'fr' ? 'Tout ce dont vous avez besoin' : 'Everything you need',
		featuresDesc: lang === 'fr'
			? 'Un editeur puissant, une recherche rapide, et des options de partage flexibles. Tout en restant simple et leger.'
			: 'A powerful editor, fast search, and flexible sharing options. All while staying simple and lightweight.',

		// Feature items
		blockEditor: lang === 'fr' ? 'Editeur de blocs' : 'Block Editor',
		blockEditorDesc: lang === 'fr'
			? 'Editeur TipTap avec markdown, code, images, fichiers, tableaux et plus encore. Menu slash pour insertion rapide.'
			: 'TipTap editor with markdown, code, images, files, tables and more. Slash menu for quick insertion.',
		hierarchical: lang === 'fr' ? 'Collections hierarchiques' : 'Hierarchical Collections',
		hierarchicalDesc: lang === 'fr'
			? 'Organisez vos snippets dans des collections imbriquees a l\'infini, comme dans Notion.'
			: 'Organize your snippets in infinitely nested collections, just like Notion.',
		fullTextSearch: lang === 'fr' ? 'Recherche full-text' : 'Full-text Search',
		fullTextSearchDesc: lang === 'fr'
			? 'Recherche instantanee avec SQLite FTS5. Filtrez par collection, tags ou statut.'
			: 'Instant search with SQLite FTS5. Filter by collection, tags or status.',
		syntaxHighlight: lang === 'fr' ? 'Syntax highlighting' : 'Syntax Highlighting',
		syntaxHighlightDesc: lang === 'fr'
			? 'Coloration syntaxique avec Shiki pour 100+ langages. Detection automatique du langage.'
			: 'Syntax highlighting with Shiki for 100+ languages. Automatic language detection.',
		publicSharing: lang === 'fr' ? 'Partage public' : 'Public Sharing',
		publicSharingDesc: lang === 'fr'
			? 'Publiez vos snippets avec une URL unique. Integrez-les via iframe dans vos sites.'
			: 'Publish your snippets with a unique URL. Embed them via iframe in your sites.',
		customTags: lang === 'fr' ? 'Tags personnalises' : 'Custom Tags',
		customTagsDesc: lang === 'fr'
			? 'Creez des tags avec couleurs pour categoriser et retrouver rapidement vos snippets.'
			: 'Create tags with colors to categorize and quickly find your snippets.',
		flexibleExport: lang === 'fr' ? 'Export flexible' : 'Flexible Export',
		flexibleExportDesc: lang === 'fr'
			? 'Exportez en Markdown ou ZIP. Export en lot ou export complet de votre vault.'
			: 'Export to Markdown or ZIP. Bulk export or full vault export.',
		restApi: 'REST API',
		restApiDesc: lang === 'fr'
			? 'API complete pour integrer SnippetVault a vos outils et workflows d\'automatisation.'
			: 'Complete API to integrate SnippetVault with your tools and automation workflows.',

		// Editor section
		editorTitle: lang === 'fr' ? 'Editeur de blocs moderne' : 'Modern Block Editor',
		editorDesc: lang === 'fr'
			? 'Inspire de Notion, l\'editeur supporte de nombreux types de blocs pour structurer vos snippets de maniere claire et organisee.'
			: 'Inspired by Notion, the editor supports many block types to structure your snippets clearly and organized.',
		slashMenu: lang === 'fr' ? 'Menu slash' : 'Slash menu',
		slashMenuDesc: lang === 'fr' ? 'Tapez / pour inserer code, images, tableaux...' : 'Type / to insert code, images, tables...',
		autoDetect: lang === 'fr' ? 'Detection automatique' : 'Auto detection',
		autoDetectDesc: lang === 'fr' ? 'Le langage est detecte automatiquement' : 'Language is detected automatically',
		dragDrop: 'Drag & Drop',
		dragDropDesc: lang === 'fr' ? 'Glissez-deposez images et fichiers' : 'Drag and drop images and files',
		tables: lang === 'fr' ? 'Tableaux' : 'Tables',
		tablesDesc: lang === 'fr' ? 'Creez des tableaux avec en-tetes' : 'Create tables with headers',
		supportedBlocks: lang === 'fr' ? 'Blocs supportes' : 'Supported blocks',

		// Self-hosted section
		selfHostedTitle: lang === 'fr' ? 'Vos donnees, votre serveur' : 'Your data, your server',
		selfHostedDesc: lang === 'fr'
			? 'Deployer SnippetVault prend moins de 5 minutes. Un seul conteneur Docker, un fichier SQLite, et c\'est parti.'
			: 'Deploying SnippetVault takes less than 5 minutes. One Docker container, one SQLite file, and you\'re good to go.',
		selfHostedBenefit: lang === 'fr' ? 'Auto-heberge' : 'Self-hosted',
		selfHostedBenefitDesc: lang === 'fr' ? 'Vos donnees restent sur votre serveur. Un seul conteneur Docker avec SQLite.' : 'Your data stays on your server. One Docker container with SQLite.',
		privacy: lang === 'fr' ? 'Vie privee' : 'Privacy',
		privacyDesc: lang === 'fr' ? 'Aucune telemetrie, aucun tracking. Vos snippets sont vraiment prives.' : 'No telemetry, no tracking. Your snippets are truly private.',
		performant: lang === 'fr' ? 'Performant' : 'Fast',
		performantDesc: lang === 'fr' ? 'SQLite avec WAL mode. Recherche FTS5 ultra-rapide. Interface reactive.' : 'SQLite with WAL mode. Ultra-fast FTS5 search. Reactive interface.',
		simple: 'Simple',
		simpleDesc: lang === 'fr' ? 'Pas de PostgreSQL, pas de Redis. Un fichier SQLite pour toutes vos donnees.' : 'No PostgreSQL, no Redis. One SQLite file for all your data.',
		deployCommand: lang === 'fr' ? 'Deploiement en une commande' : 'One command deployment',
		cloneAndRun: lang === 'fr' ? '# Clone et lance' : '# Clone and run',
		thatsIt: lang === 'fr' ? '# C\'est tout ! Ouvrez http://localhost:3000' : '# That\'s it! Open http://localhost:3000',

		// API section
		apiTitle: lang === 'fr' ? 'Integrez partout' : 'Integrate everywhere',
		apiDesc: lang === 'fr'
			? 'Une API REST complete pour integrer SnippetVault a vos outils favoris. Automatisez la creation de snippets, synchronisez avec vos workflows.'
			: 'A complete REST API to integrate SnippetVault with your favorite tools. Automate snippet creation, sync with your workflows.',
		endpoints: lang === 'fr' ? '42+ endpoints documentes' : '42+ documented endpoints',
		apiKeyAuth: lang === 'fr' ? 'Authentification par cle API' : 'API key authentication',
		crudComplete: lang === 'fr' ? 'CRUD complet snippets/collections/tags' : 'Full CRUD for snippets/collections/tags',
		searchApi: lang === 'fr' ? 'Recherche full-text via API' : 'Full-text search via API',
		gistExport: lang === 'fr' ? 'Export GitHub Gist' : 'GitHub Gist export',
		viewApiDocs: lang === 'fr' ? 'Voir la documentation API' : 'View API documentation',

		// MCP AI Integration section
		mcpBadge: lang === 'fr' ? 'Integration IA' : 'AI Integration',
		mcpTitle: lang === 'fr' ? 'Connectez votre IA' : 'Connect your AI',
		mcpDesc: lang === 'fr'
			? 'Utilisez le protocole MCP (Model Context Protocol) pour connecter Claude ou d\'autres assistants IA a votre vault. Recherchez, creez et gerez vos snippets par conversation.'
			: 'Use the MCP (Model Context Protocol) to connect Claude or other AI assistants to your vault. Search, create and manage your snippets through conversation.',
		mcpFeature1: lang === 'fr' ? 'Recherche intelligente' : 'Smart search',
		mcpFeature1Desc: lang === 'fr' ? 'Demandez a Claude de trouver vos snippets par description' : 'Ask Claude to find your snippets by description',
		mcpFeature2: lang === 'fr' ? 'Creation automatique' : 'Auto-creation',
		mcpFeature2Desc: lang === 'fr' ? 'Sauvegardez du code directement depuis vos conversations' : 'Save code directly from your conversations',
		mcpFeature3: lang === 'fr' ? 'Organisation assistee' : 'Assisted organization',
		mcpFeature3Desc: lang === 'fr' ? 'Laissez l\'IA tagger et classer vos snippets' : 'Let AI tag and classify your snippets',
		mcpTools: lang === 'fr' ? '8 outils MCP disponibles' : '8 MCP tools available',
		mcpToolSearch: lang === 'fr' ? 'Rechercher des snippets' : 'Search snippets',
		mcpToolCreate: lang === 'fr' ? 'Creer des snippets' : 'Create snippets',
		mcpToolUpdate: lang === 'fr' ? 'Modifier des snippets' : 'Update snippets',
		mcpToolCollections: lang === 'fr' ? 'Gerer les collections' : 'Manage collections',
		mcpToolTags: lang === 'fr' ? 'Gerer les tags' : 'Manage tags',
		mcpCompatible: lang === 'fr' ? 'Compatible avec' : 'Compatible with',
		mcpSetup: lang === 'fr' ? 'Configuration simple' : 'Simple setup',
		mcpSetupDesc: lang === 'fr'
			? 'Ajoutez votre serveur MCP dans les parametres de Claude.ai et commencez a interagir avec vos snippets.'
			: 'Add your MCP server in Claude.ai settings and start interacting with your snippets.',
		mcpViewDocs: lang === 'fr' ? 'Documentation MCP' : 'MCP Documentation',

		// Hosted interest section
		hostedTitle: lang === 'fr' ? 'Interesse par une version hebergee ?' : 'Interested in a hosted version?',
		hostedDesc: lang === 'fr'
			? 'Nous envisageons de proposer une version cloud de SnippetVault pour ceux qui ne souhaitent pas auto-heberger. Laissez votre email pour etre informe.'
			: 'We\'re considering offering a cloud version of SnippetVault for those who don\'t want to self-host. Leave your email to be notified.',
		emailPlaceholder: lang === 'fr' ? 'Votre email' : 'Your email',
		notifyMe: lang === 'fr' ? 'Me notifier' : 'Notify me',
		submitting: lang === 'fr' ? 'Envoi...' : 'Submitting...',
		thankYou: lang === 'fr' ? 'Merci ! Nous vous contacterons.' : 'Thank you! We\'ll be in touch.',
		noSpam: lang === 'fr' ? 'Pas de spam, juste une notification au lancement.' : 'No spam, just a notification at launch.',

		// Demo section
		demoTitle: lang === 'fr' ? 'Decouvrez l\'interface' : 'See it in action',
		demoDesc: lang === 'fr'
			? 'Une interface claire et dense, concue pour les developpeurs. Dashboard avec statistiques, recherche rapide, et gestion par tags.'
			: 'A clean and dense interface, designed for developers. Dashboard with statistics, quick search, and tag management.',
		demoDashboard: 'Dashboard',
		demoLanguages: lang === 'fr' ? 'Langages detectes' : 'Detected languages',
		demoTags: lang === 'fr' ? 'Organisation par tags' : 'Tag organization',
		demoSearch: lang === 'fr' ? 'Recherche instantanee' : 'Instant search',

		// CTA
		ctaTitle: lang === 'fr' ? 'Pret a organiser vos snippets ?' : 'Ready to organize your snippets?',
		ctaDesc: lang === 'fr'
			? 'Deployez SnippetVault en quelques minutes et commencez a gerer vos snippets de code de maniere professionnelle.'
			: 'Deploy SnippetVault in minutes and start managing your code snippets professionally.',
		deployOnYourServer: lang === 'fr' ? 'Deployer sur votre serveur' : 'Deploy on your server',
		starOnGithub: 'Star on GitHub',

		// Footer
		product: lang === 'fr' ? 'Produit' : 'Product',
		resources: lang === 'fr' ? 'Ressources' : 'Resources',
		legal: lang === 'fr' ? 'Legal' : 'Legal',
		license: lang === 'fr' ? 'Licence MIT' : 'MIT License',
		footerDesc: lang === 'fr'
			? 'Gestionnaire de snippets de code open source et auto-heberge.'
			: 'Open source and self-hosted code snippet manager.',
		copyright: lang === 'fr' ? 'Open source sous licence MIT.' : 'Open source under MIT license.',

		// Blocks
		markdown: 'Markdown',
		code: 'Code',
		images: 'Images',
		files: lang === 'fr' ? 'Fichiers' : 'Files',
		callouts: 'Callouts',
		tasks: lang === 'fr' ? 'Taches' : 'Tasks',
		links: lang === 'fr' ? 'Liens' : 'Links'
	});

	const features = $derived([
		{
			icon: Blocks,
			title: t.blockEditor,
			description: t.blockEditorDesc
		},
		{
			icon: FolderTree,
			title: t.hierarchical,
			description: t.hierarchicalDesc
		},
		{
			icon: Search,
			title: t.fullTextSearch,
			description: t.fullTextSearchDesc
		},
		{
			icon: Code2,
			title: t.syntaxHighlight,
			description: t.syntaxHighlightDesc
		},
		{
			icon: Share2,
			title: t.publicSharing,
			description: t.publicSharingDesc
		},
		{
			icon: Tags,
			title: t.customTags,
			description: t.customTagsDesc
		},
		{
			icon: Download,
			title: t.flexibleExport,
			description: t.flexibleExportDesc
		},
		{
			icon: Terminal,
			title: t.restApi,
			description: t.restApiDesc
		}
	]);

	const benefits = $derived([
		{
			icon: Server,
			title: t.selfHostedBenefit,
			description: t.selfHostedBenefitDesc
		},
		{
			icon: Lock,
			title: t.privacy,
			description: t.privacyDesc
		},
		{
			icon: Zap,
			title: t.performant,
			description: t.performantDesc
		},
		{
			icon: Database,
			title: t.simple,
			description: t.simpleDesc
		}
	]);

	const codeExample = `// API Example - Create a snippet
const response = await fetch('/api/v1/snippets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Quick Sort Algorithm',
    blocks: [
      { type: 'markdown', content: '## Description\\nEfficient sorting...' },
      { type: 'code', content: 'function quickSort(arr) {...}', language: 'javascript' }
    ],
    tagIds: ['algorithms', 'javascript']
  })
});`;
</script>

<svelte:head>
	<title>SnippetVault - {lang === 'fr' ? 'Gestionnaire de snippets auto-heberge' : 'Self-hosted snippet manager'}</title>
	<meta
		name="description"
		content={lang === 'fr'
			? 'SnippetVault est un gestionnaire de snippets de code auto-heberge avec editeur de blocs, recherche full-text et partage public.'
			: 'SnippetVault is a self-hosted code snippet manager with block editor, full-text search and public sharing.'}
	/>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Navigation -->
	<nav class="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan-400 text-white shadow-sm">
						<Code2 class="h-5 w-5" />
					</div>
					<div class="flex flex-col">
						<span class="text-lg font-bold text-foreground leading-tight">SnippetVault</span>
						<span class="text-[10px] font-medium text-muted tracking-wider uppercase leading-tight hidden sm:block">Your code. Your rules.</span>
					</div>
				</div>
				<div class="hidden md:flex items-center gap-8">
					<a href="#features" class="text-sm text-muted hover:text-foreground transition-colors">
						{t.features}
					</a>
					<a href="#mcp" class="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
						<BrainCircuit class="h-3.5 w-3.5" />
						MCP
					</a>
					<a href="#self-hosted" class="text-sm text-muted hover:text-foreground transition-colors">
						{t.selfHosted}
					</a>
					<a href="#api" class="text-sm text-muted hover:text-foreground transition-colors">
						{t.api}
					</a>
					<a
						href="https://github.com/Gus0711/SnippetVault"
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1"
					>
						<Github class="h-4 w-4" />
						GitHub
					</a>
				</div>
				<div class="flex items-center gap-3">
					<!-- Language toggle -->
					<button
						onclick={toggleLang}
						class="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
						title={lang === 'fr' ? 'Switch to English' : 'Passer en francais'}
					>
						<Languages class="h-4 w-4" />
						<span class="uppercase">{lang}</span>
					</button>
					<a
						href="https://github.com/Gus0711/SnippetVault"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
					>
						{t.getStarted}
						<ChevronRight class="h-4 w-4" />
					</a>
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<section class="relative overflow-hidden">
		<div class="absolute inset-0 -z-10">
			<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent"></div>
		</div>
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div>
					<div class="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted mb-6">
						<span class="flex h-2 w-2 rounded-full bg-green-500"></span>
						{t.badge}
					</div>
					<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
						{t.heroTitle1}
						<span class="text-accent">{t.heroTitle2}</span>
					</h1>
					<!-- Tagline from logo -->
					<p class="mt-3 text-lg font-medium text-accent/80 tracking-wide uppercase">
						{lang === 'fr' ? 'Votre code. Vos regles.' : 'Your code. Your rules.'}
					</p>
					<p class="mt-6 text-lg text-muted leading-relaxed max-w-xl">
						{t.heroDesc}
					</p>
					<div class="mt-8 flex flex-wrap gap-4">
						<a
							href="https://github.com/Gus0711/SnippetVault#installation"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
						>
							{t.deployNow}
							<ChevronRight class="h-4 w-4" />
						</a>
						<a
							href="https://github.com/Gus0711/SnippetVault"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-foreground hover:bg-border/50 transition-colors"
						>
							<Github class="h-4 w-4" />
							{t.viewOnGithub}
						</a>
					</div>
					<div class="mt-8 flex items-center gap-6 text-sm text-muted">
						<div class="flex items-center gap-2">
							<Star class="h-4 w-4 text-yellow-500" />
							<span>{t.openSource}</span>
						</div>
						<div class="flex items-center gap-2">
							<Server class="h-4 w-4" />
							<span>{t.dockerReady}</span>
						</div>
						<div class="flex items-center gap-2">
							<Lock class="h-4 w-4" />
							<span>{t.private}</span>
						</div>
					</div>
				</div>
				<div class="relative">
					<div class="rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
						<div class="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
							<div class="flex gap-1.5">
								<div class="h-3 w-3 rounded-full bg-red-500/80"></div>
								<div class="h-3 w-3 rounded-full bg-yellow-500/80"></div>
								<div class="h-3 w-3 rounded-full bg-green-500/80"></div>
							</div>
							<span class="text-xs text-muted ml-2">snippet-vault.ts</span>
						</div>
						<div class="p-4 font-mono text-sm leading-relaxed overflow-x-auto">
							<pre class="text-foreground"><code><span class="text-purple-500">const</span> <span class="text-blue-400">snippet</span> = {'{'}
  <span class="text-green-400">title</span>: <span class="text-amber-400">"Quick Sort"</span>,
  <span class="text-green-400">language</span>: <span class="text-amber-400">"typescript"</span>,
  <span class="text-green-400">tags</span>: [<span class="text-amber-400">"algorithms"</span>, <span class="text-amber-400">"sorting"</span>],
  <span class="text-green-400">blocks</span>: [
    {'{'} <span class="text-green-400">type</span>: <span class="text-amber-400">"markdown"</span>, <span class="text-green-400">content</span>: <span class="text-amber-400">"..."</span> {'}'},
    {'{'} <span class="text-green-400">type</span>: <span class="text-amber-400">"code"</span>, <span class="text-green-400">lang</span>: <span class="text-amber-400">"ts"</span> {'}'}
  ]
{'}'};

<span class="text-purple-500">await</span> <span class="text-blue-400">vault</span>.<span class="text-yellow-400">save</span>(snippet);</code></pre>
						</div>
					</div>
					<div class="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-xl bg-accent/20"></div>
				</div>
			</div>
		</div>
	</section>

	<!-- Demo Section -->
	<section id="demo" class="py-24">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-12">
				<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
					{t.demoTitle}
				</h2>
				<p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
					{t.demoDesc}
				</p>
			</div>

			<!-- Demo GIF in browser frame -->
			<div class="relative mx-auto max-w-5xl">
				<div class="rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
					<div class="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
						<div class="flex gap-1.5">
							<div class="h-3 w-3 rounded-full bg-red-500/80"></div>
							<div class="h-3 w-3 rounded-full bg-yellow-500/80"></div>
							<div class="h-3 w-3 rounded-full bg-green-500/80"></div>
						</div>
						<div class="flex-1 flex justify-center">
							<div class="flex items-center gap-2 rounded-md bg-surface border border-border px-3 py-1 text-xs text-muted">
								<Lock class="h-3 w-3" />
								localhost:3000/dashboard
							</div>
						</div>
					</div>
					<div class="relative">
						<img
							src="/images/snippetvault_video.gif"
							alt="SnippetVault Demo"
							class="w-full"
							loading="lazy"
						/>
					</div>
				</div>
				<div class="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-xl bg-accent/10"></div>
			</div>

			<!-- Feature badges under demo -->
			<div class="mt-12 flex flex-wrap justify-center gap-4">
				<div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm">
					<div class="h-2 w-2 rounded-full bg-accent"></div>
					<span class="text-foreground">{t.demoDashboard}</span>
				</div>
				<div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm">
					<div class="h-2 w-2 rounded-full bg-amber-500"></div>
					<span class="text-foreground">{t.demoLanguages}</span>
				</div>
				<div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm">
					<div class="h-2 w-2 rounded-full bg-cyan-500"></div>
					<span class="text-foreground">{t.demoTags}</span>
				</div>
				<div class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm">
					<div class="h-2 w-2 rounded-full bg-green-500"></div>
					<span class="text-foreground">{t.demoSearch}</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section id="features" class="py-24 bg-surface border-y border-border">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
					{t.featuresTitle}
				</h2>
				<p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
					{t.featuresDesc}
				</p>
			</div>
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each features as feature}
					<div class="group rounded-xl border border-border bg-background p-6 hover:border-accent/50 transition-colors">
						<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
							<feature.icon class="h-6 w-6" />
						</div>
						<h3 class="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
						<p class="text-sm text-muted leading-relaxed">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Editor Showcase -->
	<section class="py-24">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div>
					<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
						{t.editorTitle}
					</h2>
					<p class="mt-4 text-lg text-muted leading-relaxed">
						{t.editorDesc}
					</p>
					<ul class="mt-8 space-y-4">
						<li class="flex items-start gap-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
								<ChevronRight class="h-4 w-4" />
							</div>
							<div>
								<span class="font-medium text-foreground">{t.slashMenu}</span>
								<span class="text-muted"> - {t.slashMenuDesc}</span>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
								<ChevronRight class="h-4 w-4" />
							</div>
							<div>
								<span class="font-medium text-foreground">{t.autoDetect}</span>
								<span class="text-muted"> - {t.autoDetectDesc}</span>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
								<ChevronRight class="h-4 w-4" />
							</div>
							<div>
								<span class="font-medium text-foreground">{t.dragDrop}</span>
								<span class="text-muted"> - {t.dragDropDesc}</span>
							</div>
						</li>
						<li class="flex items-start gap-3">
							<div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
								<ChevronRight class="h-4 w-4" />
							</div>
							<div>
								<span class="font-medium text-foreground">{t.tables}</span>
								<span class="text-muted"> - {t.tablesDesc}</span>
							</div>
						</li>
					</ul>
				</div>
				<div class="space-y-6">
					<!-- Supported blocks list -->
					<div class="rounded-xl border border-border bg-surface p-6">
						<div class="space-y-4">
							<div class="flex items-center gap-2 text-sm text-muted">
								<FileCode class="h-4 w-4" />
								<span>{t.supportedBlocks}</span>
							</div>
							<div class="grid grid-cols-2 gap-3">
								{#each [t.markdown, t.code, t.images, t.files, t.tables, t.callouts, t.tasks, t.links] as block}
									<div class="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
										<div class="h-2 w-2 rounded-full bg-accent"></div>
										<span class="text-foreground">{block}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Dashboard preview image (clickable for zoom) -->
					<button
						type="button"
						onclick={() => { lightboxSrc = '/images/Dashboard.png'; lightboxOpen = true; }}
						class="group relative rounded-xl border border-border overflow-hidden shadow-lg cursor-zoom-in w-full text-left transition-all hover:border-accent/50 hover:shadow-xl"
					>
						<img
							src="/images/Dashboard.png"
							alt="SnippetVault Dashboard"
							class="w-full"
							loading="lazy"
						/>
						<div class="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors flex items-center justify-center">
							<div class="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-lg px-3 py-1.5 text-sm text-foreground flex items-center gap-2">
								<Search class="h-4 w-4" />
								{lang === 'fr' ? 'Cliquer pour agrandir' : 'Click to enlarge'}
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- Self-hosted Section -->
	<section id="self-hosted" class="py-24 bg-surface border-y border-border">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<div class="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent mb-4">
					<Server class="h-4 w-4" />
					{t.selfHosted}
				</div>
				<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
					{t.selfHostedTitle}
				</h2>
				<p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
					{t.selfHostedDesc}
				</p>
			</div>
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each benefits as benefit}
					<div class="text-center">
						<div class="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent mx-auto mb-4">
							<benefit.icon class="h-7 w-7" />
						</div>
						<h3 class="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
						<p class="text-sm text-muted">{benefit.description}</p>
					</div>
				{/each}
			</div>
			<div class="mt-16 rounded-xl border border-border bg-background p-6">
				<div class="flex items-center gap-2 text-sm text-muted mb-4">
					<Terminal class="h-4 w-4" />
					<span>{t.deployCommand}</span>
				</div>
				<pre class="font-mono text-sm text-foreground bg-surface rounded-lg p-4 overflow-x-auto"><code><span class="text-muted">{t.cloneAndRun}</span>
git clone https://github.com/Gus0711/SnippetVault.git
cd SnippetVault
docker compose up -d

<span class="text-muted">{t.thatsIt}</span></code></pre>
			</div>
		</div>
	</section>

	<!-- API Section -->
	<section id="api" class="py-24">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<div class="order-2 lg:order-1">
					<div class="rounded-xl border border-border bg-surface overflow-hidden">
						<div class="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
							<div class="flex gap-1.5">
								<div class="h-3 w-3 rounded-full bg-red-500/80"></div>
								<div class="h-3 w-3 rounded-full bg-yellow-500/80"></div>
								<div class="h-3 w-3 rounded-full bg-green-500/80"></div>
							</div>
							<span class="text-xs text-muted ml-2">api-example.js</span>
						</div>
						<pre class="p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto text-foreground"><code>{codeExample}</code></pre>
					</div>
				</div>
				<div class="order-1 lg:order-2">
					<div class="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted mb-4">
						<Cpu class="h-4 w-4" />
						REST API v1
					</div>
					<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
						{t.apiTitle}
					</h2>
					<p class="mt-4 text-lg text-muted leading-relaxed">
						{t.apiDesc}
					</p>
					<ul class="mt-8 space-y-3">
						<li class="flex items-center gap-3 text-muted">
							<div class="h-1.5 w-1.5 rounded-full bg-accent"></div>
							<span>{t.endpoints}</span>
						</li>
						<li class="flex items-center gap-3 text-muted">
							<div class="h-1.5 w-1.5 rounded-full bg-accent"></div>
							<span>{t.apiKeyAuth}</span>
						</li>
						<li class="flex items-center gap-3 text-muted">
							<div class="h-1.5 w-1.5 rounded-full bg-accent"></div>
							<span>{t.crudComplete}</span>
						</li>
						<li class="flex items-center gap-3 text-muted">
							<div class="h-1.5 w-1.5 rounded-full bg-accent"></div>
							<span>{t.searchApi}</span>
						</li>
						<li class="flex items-center gap-3 text-muted">
							<div class="h-1.5 w-1.5 rounded-full bg-accent"></div>
							<span>{t.gistExport}</span>
						</li>
					</ul>
					<div class="mt-8">
						<a
							href="https://github.com/Gus0711/SnippetVault/blob/main/docs/API.md"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 text-accent hover:underline"
						>
							<BookOpen class="h-4 w-4" />
							{t.viewApiDocs}
							<ExternalLink class="h-3 w-3" />
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- MCP AI Integration Section -->
	<section id="mcp" class="py-24 bg-surface border-y border-border">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<div class="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-500 dark:text-purple-400 mb-4">
					<BrainCircuit class="h-4 w-4" />
					{t.mcpBadge}
				</div>
				<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
					{t.mcpTitle}
				</h2>
				<p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
					{t.mcpDesc}
				</p>
			</div>

			<div class="grid lg:grid-cols-2 gap-12 items-center">
				<!-- Left: Features -->
				<div class="space-y-6">
					<div class="flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-purple-500/30 transition-colors">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
							<Search class="h-6 w-6" />
						</div>
						<div>
							<h3 class="font-semibold text-foreground">{t.mcpFeature1}</h3>
							<p class="text-sm text-muted mt-1">{t.mcpFeature1Desc}</p>
						</div>
					</div>
					<div class="flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-purple-500/30 transition-colors">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
							<Sparkles class="h-6 w-6" />
						</div>
						<div>
							<h3 class="font-semibold text-foreground">{t.mcpFeature2}</h3>
							<p class="text-sm text-muted mt-1">{t.mcpFeature2Desc}</p>
						</div>
					</div>
					<div class="flex items-start gap-4 p-4 rounded-xl border border-border bg-background hover:border-purple-500/30 transition-colors">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
							<Tags class="h-6 w-6" />
						</div>
						<div>
							<h3 class="font-semibold text-foreground">{t.mcpFeature3}</h3>
							<p class="text-sm text-muted mt-1">{t.mcpFeature3Desc}</p>
						</div>
					</div>

					<!-- Compatible with -->
					<div class="pt-4">
						<p class="text-sm text-muted mb-3">{t.mcpCompatible}</p>
						<div class="flex flex-wrap gap-3">
							<div class="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
								<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
								</svg>
								<span class="text-sm font-medium text-foreground">Claude.ai</span>
							</div>
							<div class="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
								<Terminal class="h-5 w-5" />
								<span class="text-sm font-medium text-foreground">Claude Code</span>
							</div>
							<div class="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
								<Bot class="h-5 w-5" />
								<span class="text-sm font-medium text-foreground">MCP Clients</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Right: Code example / Tools list -->
				<div class="space-y-6">
					<div class="rounded-xl border border-border bg-background overflow-hidden">
						<div class="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
							<div class="flex gap-1.5">
								<div class="h-3 w-3 rounded-full bg-red-500/80"></div>
								<div class="h-3 w-3 rounded-full bg-yellow-500/80"></div>
								<div class="h-3 w-3 rounded-full bg-green-500/80"></div>
							</div>
							<span class="text-xs text-muted ml-2">{t.mcpTools}</span>
						</div>
						<div class="p-4 space-y-2 font-mono text-sm">
							<div class="flex items-center gap-3">
								<span class="text-purple-500">search_snippets</span>
								<span class="text-muted">- {t.mcpToolSearch}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-green-500">create_snippet</span>
								<span class="text-muted">- {t.mcpToolCreate}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-blue-500">update_snippet</span>
								<span class="text-muted">- {t.mcpToolUpdate}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-amber-500">list_collections</span>
								<span class="text-muted">- {t.mcpToolCollections}</span>
							</div>
							<div class="flex items-center gap-3">
								<span class="text-cyan-500">list_tags</span>
								<span class="text-muted">- {t.mcpToolTags}</span>
							</div>
							<div class="text-muted pt-2 border-t border-border mt-2">+ get_snippet, delete_snippet, list_snippets</div>
						</div>
					</div>

					<!-- Example conversation -->
					<div class="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
						<div class="flex items-start gap-3 mb-4">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
								<MessageSquare class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<p class="text-sm text-foreground italic">
									"{lang === 'fr' ? 'Trouve mon snippet sur le tri rapide en Python' : 'Find my snippet about quicksort in Python'}"
								</p>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan-400 text-white">
								<Bot class="h-4 w-4" />
							</div>
							<div class="flex-1">
								<p class="text-sm text-muted">
									{lang === 'fr'
										? "J'ai trouve votre snippet 'Quick Sort Algorithm' dans la collection Algorithms. Voulez-vous que je l'affiche ?"
										: "I found your snippet 'Quick Sort Algorithm' in the Algorithms collection. Would you like me to display it?"}
								</p>
							</div>
						</div>
					</div>

					<div class="text-center">
						<a
							href="https://github.com/Gus0711/SnippetVault/tree/main/mcp-server"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 text-purple-500 hover:underline"
						>
							<BookOpen class="h-4 w-4" />
							{t.mcpViewDocs}
							<ExternalLink class="h-3 w-3" />
						</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Hosted Version Interest -->
	<section id="hosted" class="py-24 border-b border-border">
		<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
			<div class="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-accent mb-6">
				<Cloud class="h-4 w-4" />
				Cloud Version
			</div>
			<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
				{t.hostedTitle}
			</h2>
			<p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
				{t.hostedDesc}
			</p>

			{#if surveySubmitted}
				<div class="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6 flex items-center justify-center gap-3">
					<CheckCircle class="h-6 w-6 text-green-500" />
					<span class="text-green-600 dark:text-green-400 font-medium">{t.thankYou}</span>
				</div>
			{:else}
				<form onsubmit={submitSurvey} class="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
					<div class="relative flex-1">
						<Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" />
						<input
							type="email"
							bind:value={surveyEmail}
							placeholder={t.emailPlaceholder}
							required
							class="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
						/>
					</div>
					<button
						type="submit"
						disabled={surveyLoading}
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
					>
						{#if surveyLoading}
							<span class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
							{t.submitting}
						{:else}
							{t.notifyMe}
							<ChevronRight class="h-4 w-4" />
						{/if}
					</button>
				</form>
				<p class="mt-4 text-sm text-muted">{t.noSpam}</p>
			{/if}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="py-24">
		<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
			<!-- Styled logo icon -->
			<div class="flex justify-center mb-8">
				<div class="relative">
					<div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-cyan-400 text-white shadow-lg shadow-accent/25">
						<Code2 class="h-10 w-10" />
					</div>
					<div class="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-accent to-cyan-400 opacity-20 blur-lg"></div>
				</div>
			</div>
			<p class="text-sm font-medium text-accent/80 tracking-widest uppercase mb-4">
				{lang === 'fr' ? 'Votre code. Vos regles.' : 'Your code. Your rules.'}
			</p>
			<h2 class="text-3xl sm:text-4xl font-bold text-foreground">
				{t.ctaTitle}
			</h2>
			<p class="mt-4 text-lg text-muted max-w-2xl mx-auto">
				{t.ctaDesc}
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-4">
				<a
					href="https://github.com/Gus0711/SnippetVault#installation"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-lg bg-accent px-8 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
				>
					<Server class="h-4 w-4" />
					{t.deployOnYourServer}
					<ChevronRight class="h-4 w-4" />
				</a>
				<a
					href="https://github.com/Gus0711/SnippetVault"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-8 py-3 text-sm font-medium text-foreground hover:bg-border/50 transition-colors"
				>
					<Github class="h-4 w-4" />
					{t.starOnGithub}
				</a>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-border bg-background py-12">
		<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
				<div class="col-span-2 md:col-span-1">
					<div class="flex items-center gap-2.5 mb-4">
						<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan-400 text-white">
							<Code2 class="h-5 w-5" />
						</div>
						<div>
							<span class="text-lg font-bold text-foreground block leading-tight">SnippetVault</span>
							<span class="text-[10px] font-medium text-muted tracking-wider uppercase">Your code. Your rules.</span>
						</div>
					</div>
					<p class="text-sm text-muted">
						{t.footerDesc}
					</p>
				</div>
				<div>
					<h4 class="font-semibold text-foreground mb-4">{t.product}</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a href="#features" class="text-muted hover:text-foreground transition-colors">
								{t.features}
							</a>
						</li>
						<li>
							<a href="#mcp" class="text-muted hover:text-foreground transition-colors flex items-center gap-1">
								<BrainCircuit class="h-3 w-3" />
								MCP / AI
							</a>
						</li>
						<li>
							<a href="#self-hosted" class="text-muted hover:text-foreground transition-colors">
								{t.selfHosted}
							</a>
						</li>
						<li>
							<a href="#api" class="text-muted hover:text-foreground transition-colors">
								{t.api}
							</a>
						</li>
					</ul>
				</div>
				<div>
					<h4 class="font-semibold text-foreground mb-4">{t.resources}</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a
								href="https://github.com/Gus0711/SnippetVault"
								target="_blank"
								rel="noopener noreferrer"
								class="text-muted hover:text-foreground transition-colors flex items-center gap-1"
							>
								GitHub
								<ExternalLink class="h-3 w-3" />
							</a>
						</li>
						<li>
							<a
								href="https://github.com/Gus0711/SnippetVault/tree/main/docs"
								target="_blank"
								rel="noopener noreferrer"
								class="text-muted hover:text-foreground transition-colors flex items-center gap-1"
							>
								{t.docs}
								<ExternalLink class="h-3 w-3" />
							</a>
						</li>
						<li>
							<a
								href="https://github.com/Gus0711/SnippetVault/issues"
								target="_blank"
								rel="noopener noreferrer"
								class="text-muted hover:text-foreground transition-colors flex items-center gap-1"
							>
								Issues
								<ExternalLink class="h-3 w-3" />
							</a>
						</li>
					</ul>
				</div>
				<div>
					<h4 class="font-semibold text-foreground mb-4">{t.legal}</h4>
					<ul class="space-y-2 text-sm">
						<li>
							<a
								href="https://github.com/Gus0711/SnippetVault/blob/main/LICENSE"
								target="_blank"
								rel="noopener noreferrer"
								class="text-muted hover:text-foreground transition-colors"
							>
								{t.license}
							</a>
						</li>
						<li class="pt-4 border-t border-border mt-4">
							{#if data.user}
								<a
									href="/dashboard"
									class="text-muted hover:text-foreground transition-colors"
								>
									{lang === 'fr' ? 'Mon Dashboard' : 'My Dashboard'}
								</a>
							{:else}
								<a
									href="/auth/login"
									class="text-muted hover:text-foreground transition-colors"
								>
									{lang === 'fr' ? 'Connexion Admin' : 'Admin Login'}
								</a>
							{/if}
						</li>
					</ul>
				</div>
			</div>
			<div class="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
				<p class="text-sm text-muted">
					2024 SnippetVault. {t.copyright}
				</p>
				<div class="flex items-center gap-4">
					<button
						onclick={toggleLang}
						class="text-muted hover:text-foreground transition-colors text-sm flex items-center gap-1"
					>
						<Globe class="h-4 w-4" />
						{lang === 'fr' ? 'English' : 'Francais'}
					</button>
					<a
						href="https://github.com/Gus0711/SnippetVault"
						target="_blank"
						rel="noopener noreferrer"
						class="text-muted hover:text-foreground transition-colors"
					>
						<Github class="h-5 w-5" />
					</a>
				</div>
			</div>
		</div>
	</footer>
</div>

<!-- Lightbox Modal -->
{#if lightboxOpen}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-zoom-out"
		onclick={() => lightboxOpen = false}
		onkeydown={(e) => e.key === 'Escape' && (lightboxOpen = false)}
		role="button"
		tabindex="0"
	>
		<button
			type="button"
			class="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
			onclick={() => lightboxOpen = false}
		>
			<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<img
			src={lightboxSrc}
			alt="SnippetVault Dashboard - Full size"
			class="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		/>
	</div>
{/if}

<style>
	/* Smooth scrolling for anchor links */
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
