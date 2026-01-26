// Language colors - inspired by GitHub's language colors
export const languageColors: Record<string, string> = {
	javascript: '#f1e05a',
	typescript: '#3178c6',
	python: '#3572A5',
	java: '#b07219',
	csharp: '#178600',
	cpp: '#f34b7d',
	c: '#555555',
	go: '#00ADD8',
	rust: '#dea584',
	php: '#4F5D95',
	ruby: '#701516',
	swift: '#F05138',
	kotlin: '#A97BFF',
	html: '#e34c26',
	css: '#563d7c',
	scss: '#c6538c',
	sql: '#e38c00',
	json: '#f5a623',
	yaml: '#cb171e',
	bash: '#89e051',
	shell: '#89e051',
	shellscript: '#89e051',
	markdown: '#083fa1',
	xml: '#0060ac',
	dockerfile: '#384d54',
	vue: '#41b883',
	svelte: '#ff3e00',
	react: '#61dafb',
	angular: '#dd0031',
	graphql: '#e10098',
	plaintext: '#6b7280'
};

// Get color for a language (with fallback)
export function getLanguageColor(language: string | null | undefined): string {
	if (!language) return '#6b7280';
	const lower = language.toLowerCase();
	return languageColors[lower] || '#6b7280';
}

// Short name mapping for languages
export const langShortMap: Record<string, string> = {
	javascript: 'js',
	typescript: 'ts',
	python: 'py',
	markdown: 'md',
	dockerfile: 'docker',
	shellscript: 'sh',
	bash: 'sh'
};

// Format language name (short version)
export function formatLang(lang: string | null | undefined): string {
	if (!lang) return '';
	const lower = lang.toLowerCase();
	return langShortMap[lower] || lower;
}

// Predefined tag colors
export const tagColors = [
	'#ef4444', '#f97316', '#f59e0b', '#eab308',
	'#84cc16', '#22c55e', '#10b981', '#14b8a6',
	'#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
	'#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

// Get a random tag color
export function getRandomTagColor(): string {
	return tagColors[Math.floor(Math.random() * tagColors.length)];
}

// Auto-detect language from code content
export function detectLanguage(content: string): string | null {
	if (!content || content.trim().length < 5) return null;

	const trimmed = content.trim();
	const lower = trimmed.toLowerCase();

	// JSON detection - must be valid JSON
	if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
		(trimmed.startsWith('[') && trimmed.endsWith(']'))) {
		try {
			JSON.parse(trimmed);
			return 'json';
		} catch {
			// Not valid JSON, continue checking
		}
	}

	// HTML detection
	if (trimmed.startsWith('<') && (
		lower.includes('<!doctype') ||
		lower.includes('<html') ||
		lower.includes('<head') ||
		lower.includes('<body') ||
		lower.includes('<div') ||
		lower.includes('<span') ||
		lower.includes('<p>') ||
		lower.includes('<a ') ||
		lower.includes('<script') ||
		lower.includes('<style') ||
		lower.includes('<link') ||
		lower.includes('<meta') ||
		lower.includes('<img') ||
		lower.includes('<form') ||
		lower.includes('<input') ||
		lower.includes('<button') ||
		lower.includes('<table') ||
		lower.includes('<ul') ||
		lower.includes('<ol') ||
		lower.includes('<li') ||
		lower.includes('<header') ||
		lower.includes('<footer') ||
		lower.includes('<nav') ||
		lower.includes('<section') ||
		lower.includes('<article')
	)) {
		return 'html';
	}

	// XML detection (after HTML, since HTML is more specific)
	if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.includes('xmlns'))) {
		return 'xml';
	}

	// SVG detection
	if (lower.includes('<svg') && lower.includes('</svg>')) {
		return 'xml';
	}

	// CSS detection
	if ((trimmed.includes('{') && trimmed.includes('}') && (
		trimmed.includes('color:') ||
		trimmed.includes('background') ||
		trimmed.includes('margin') ||
		trimmed.includes('padding') ||
		trimmed.includes('display:') ||
		trimmed.includes('font-') ||
		trimmed.includes('border') ||
		trimmed.includes('@media') ||
		trimmed.includes('@import') ||
		trimmed.includes('@keyframes') ||
		/^[.#]?[\w-]+\s*\{/.test(trimmed) ||
		/^[\w-]+\s*:\s*[\w-]+/.test(trimmed)
	)) && !trimmed.includes('function') && !trimmed.includes('=>')) {
		return 'css';
	}

	// Python detection
	if (
		trimmed.startsWith('import ') ||
		trimmed.startsWith('from ') ||
		trimmed.includes('\nimport ') ||
		trimmed.includes('\nfrom ') ||
		trimmed.includes('def ') ||
		trimmed.includes('class ') && trimmed.includes(':') && !trimmed.includes('{') ||
		trimmed.includes('print(') ||
		trimmed.includes('if __name__') ||
		/^\s*#.*python/i.test(trimmed) ||
		trimmed.startsWith('#!/usr/bin/env python') ||
		trimmed.startsWith('#!/usr/bin/python')
	) {
		return 'python';
	}

	// Bash/Shell detection
	if (
		trimmed.startsWith('#!/bin/bash') ||
		trimmed.startsWith('#!/bin/sh') ||
		trimmed.startsWith('#!/usr/bin/env bash') ||
		(trimmed.includes('echo ') && (trimmed.includes('$') || trimmed.includes('|'))) ||
		/^\s*(export|alias|source|chmod|mkdir|rm|cp|mv|ls|cd|grep|awk|sed)\s/.test(trimmed) ||
		(trimmed.includes('if [') && trimmed.includes('then')) ||
		(trimmed.includes('for ') && trimmed.includes(' in ') && trimmed.includes('do'))
	) {
		return 'bash';
	}

	// SQL detection
	if (
		/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|WITH)\s/i.test(trimmed) ||
		(lower.includes(' from ') && lower.includes(' where ')) ||
		(lower.includes('create table') || lower.includes('alter table'))
	) {
		return 'sql';
	}

	// YAML detection
	if (
		!trimmed.includes('{') &&
		!trimmed.includes(';') &&
		/^[\w-]+:\s*.+$/m.test(trimmed) &&
		(trimmed.includes(':\n') || trimmed.includes(': ')) &&
		!trimmed.includes('function')
	) {
		return 'yaml';
	}

	// TypeScript detection (before JavaScript)
	if (
		trimmed.includes(': string') ||
		trimmed.includes(': number') ||
		trimmed.includes(': boolean') ||
		trimmed.includes(': any') ||
		trimmed.includes(': void') ||
		trimmed.includes('interface ') ||
		trimmed.includes('type ') && trimmed.includes(' = ') && trimmed.includes('<') ||
		trimmed.includes('<T>') ||
		trimmed.includes('as const') ||
		/:\s*(string|number|boolean|any)\s*[;,)=]/.test(trimmed)
	) {
		return 'typescript';
	}

	// JavaScript detection
	if (
		trimmed.includes('const ') ||
		trimmed.includes('let ') ||
		trimmed.includes('var ') ||
		trimmed.includes('function ') ||
		trimmed.includes('=>') ||
		trimmed.includes('console.log') ||
		trimmed.includes('document.') ||
		trimmed.includes('window.') ||
		trimmed.includes('require(') ||
		trimmed.includes('module.exports') ||
		trimmed.includes('export default') ||
		trimmed.includes('export const') ||
		trimmed.includes('async ') ||
		trimmed.includes('await ')
	) {
		return 'javascript';
	}

	// Go detection
	if (
		trimmed.includes('package ') ||
		trimmed.includes('func ') ||
		(trimmed.includes('import (') || trimmed.includes('import "')) ||
		trimmed.includes('fmt.') ||
		trimmed.includes(':= ')
	) {
		return 'go';
	}

	// Rust detection
	if (
		trimmed.includes('fn ') ||
		trimmed.includes('let mut ') ||
		trimmed.includes('impl ') ||
		trimmed.includes('pub fn') ||
		trimmed.includes('use std::') ||
		trimmed.includes('println!') ||
		trimmed.includes('-> ')
	) {
		return 'rust';
	}

	// Java detection
	if (
		trimmed.includes('public class ') ||
		trimmed.includes('private ') ||
		trimmed.includes('public static void main') ||
		trimmed.includes('System.out.println') ||
		(trimmed.includes('import java.') || trimmed.includes('import javax.'))
	) {
		return 'java';
	}

	// C# detection
	if (
		trimmed.includes('using System') ||
		trimmed.includes('namespace ') ||
		trimmed.includes('public class ') && trimmed.includes('void ') ||
		trimmed.includes('Console.WriteLine')
	) {
		return 'csharp';
	}

	// PHP detection
	if (
		trimmed.startsWith('<?php') ||
		trimmed.includes('<?php') ||
		(trimmed.includes('$') && trimmed.includes('->') && trimmed.includes(';'))
	) {
		return 'php';
	}

	// Dockerfile detection
	if (
		trimmed.startsWith('FROM ') ||
		(trimmed.includes('RUN ') && trimmed.includes('COPY ')) ||
		trimmed.includes('ENTRYPOINT ') ||
		trimmed.includes('WORKDIR ')
	) {
		return 'dockerfile';
	}

	// Markdown detection
	if (
		trimmed.startsWith('# ') ||
		trimmed.startsWith('## ') ||
		trimmed.includes('\n## ') ||
		trimmed.includes('\n# ') ||
		(trimmed.includes('```') && trimmed.includes('\n')) ||
		/^\s*[-*]\s+\w/.test(trimmed) && trimmed.includes('\n')
	) {
		return 'markdown';
	}

	return null;
}
