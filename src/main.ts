#!/usr/bin/env node
/** @format */

import inquirer from 'inquirer';
import sharpyy from 'sharpyy';

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

import { box, start, success, info, stop, base } from './functions/log.js';
import path from 'path';

const pkg: { [index: string]: any } = {
	name: '',
	description: '',
	version: '0.0.1',
	author: '',
	type: '',
	license: '',
	scripts: {},
	dependencies: {},
	devDependencies: {},
};

const settings: { [index: string]: any } = {
	language: '',
	type: '',
	src: false,
	root: [],
	structure: [],
};

const templates = [];

const devDependencies = [];

const shell = promisify(exec);

(async () => {
	console.clear();

	box(sharpyy("Dummi's Project Wizard", `txRainbow`, `bold`));

	start();

	success(`Project info`);

	const project = await inquirer.prompt([
		{
			type: `input`,
			name: `name`,
			message: `${base} Enter the project name:`,
			validate: (input) => {
				if (input.trim() === '') {
					return `Project name cannot be empty.`;
				}
				return true;
			},
		},
		{
			type: `input`,
			name: `description`,
			message: `${base} Enter a description for the project:`,
		},
	]);

	let author;

	try {
		info(`Looking for git user name as author.`);

		author = (await shell(`git config --global user.name`)).stdout;

		success(`Found ${sharpyy(author.replace(`\n`, ''), `txMagenta`, `underline`)} as author.`);
	} catch {
		author = (
			await inquirer.prompt([
				{
					type: `input`,
					name: `author`,
					message: 'Couldn`t find your git user name, enter author name:',
				},
			])
		).author;
	}

	pkg.name = project.name;
	pkg.description = project.description;
	pkg.author = author.replace(`\n`, '');

	const config = await inquirer.prompt([
		{
			type: `list`,
			name: `language`,
			message: `${base} Choose a programming language:`,
			choices: [`JavaScript`, `TypeScript`],
		},
		{
			type: `list`,
			name: `type`,
			message: `${base} Choose a project type:`,
			choices: [`Application`, `CLI`, `NPM Package`, `Web Application`],
		},
		{
			type: `list`,
			name: `license`,
			message: `${base} Do you want to generate a license:`,
			choices: [`MIT`, `None`],
		},
		{
			type: `checkbox`,
			name: `root`,
			message: `${base} root folders?`,
			choices: [`src`, `docs`, `test`, `public`, `.github`, `templates`, `types`, `dist`, `bin`].sort(),
		},
		{
			type: `checkbox`,
			name: `structure`,
			message: `${base} Folder structure?`,
			choices: [`events`, `handler`, `templates`, `types`, `build`, `functions`, `models`, `components`, `client`, `schema`, `tools`, `util`, `validators`, `pages`, `server`, `database`].sort(),
		},
	]);

	settings.language = config.language;
	settings.type = config.type;
	settings.structure = config.structure;
	settings.root = config.root;
	settings.src = settings.root.includes(`src`);

	pkg.license = config.license;

	if (pkg.license !== `None`) templates.push(`LICENSE`);

	if (settings.language == `TypeScript` || settings.language == `JavaScript`) {
		const type = await inquirer.prompt([
			{
				type: `confirm`,
				name: `type`,
				message: `${base} Do you want to use ESModules?`,
				default: true,
			},
		]);

		pkg.type = type.type ? `module` : `commonjs`;
	}

	if (settings.language == `TypeScript`) {
		devDependencies.push(`typescript`);
		templates.push(`tsconfig.json`);
	}

	if (settings.type === `NPM Package`) {
		devDependencies.push(`tsup`, `publishyy`);
		templates.push(`tsup.config.ts`, `pub.config.js`);
	}

	pkg.scripts.start = `npm install --production && node . --production`;
	pkg.scripts.dev = `npm install && nodemon`;

	if (settings.type === `Web Application`) {
		const type = await inquirer.prompt([
			{
				type: `list`,
				name: `framework`,
				message: `${base} Choose a web framework:`,
				choices: [`React`, `next.js`, `html`],
			},
		]);

		if (type.framework === `React`) {
			info(`React has their own wizard, ${sharpyy(`use npx create-react-app ${pkg.name} && cd ${pkg.name}`, `bgGray`)}`);

			shell(`npx create-react-app ${pkg.name} && cd ${pkg.name}`);

			return process.exit();
		} else if (type.framework === `next.js`) {
			info(`Next.js has their own wizard, ${sharpyy(`use npx create-next-app ${pkg.name} && cd ${pkg.name}`, `bgGray`)}`);

			shell(`npx create-next-app ${pkg.name} && cd ${pkg.name}`);

			return process.exit();
		} else {
			shell(`mkdir ${pkg.name} && cd ${pkg.name}`);
		}
	}

	if (settings.type === `CLI`) {
		if (settings.language === `JavaScript`) {
			pkg.bin = `./${settings.src ? `src/` : ''}main.js`;
		}

		if (settings.language === `TypeScript`) {
			pkg.bin = `./${settings.src ? `dist/` : ''}main.ts`;

			pkg.scripts.build = `tsc -w`;
		}

		templates.push(`.npmignore`);
	}

	if (settings.type === `NPM Package`) {
		pkg.main = `./${settings.src ? `dist/` : ''}main.cjs`;
		pkg.module = `./${settings.src ? `dist/` : ''}main.js`;
		pkg.types = `./${settings.src ? `dist/` : ''}main.d.ts`;

		pkg.exports = {
			require: {
				types: `./${settings.src ? `dist/` : ``}main.d.ts`,
				default: `./${settings.src ? `dist/` : ``}main.cjs`,
			},
			import: {
				types: `./${settings.src ? `dist/` : ``}main.d.ts`,
				default: `./${settings.src ? `dist/` : ``}main.js`,
			},
		};

		pkg.scripts.build = `tsup -w`;

		templates.push(`.npmignore`);

		const { typedoc } = await inquirer.prompt([{ type: `confirm`, name: `typedoc`, message: `${base} Use typedoc for documentation generation?`, default: true }]);

		if (typedoc) {
			templates.push(`typedoc.json`);

			devDependencies.push(`typedoc`, 'typedoc-github-theme');
		}
	}

	const format = await inquirer.prompt([
		{
			type: `confirm`,
			name: `format`,
			message: `${base} format using prettier?`,
		},
	]);

	settings.format = format.format;

	if (settings.format) {
		pkg.scripts.format = `npx prettier --write dist src`;
		devDependencies.push(`prettier`);
		templates.push(`.prettierrc`);
	}

	const git = await inquirer.prompt([{ type: `confirm`, name: `git`, message: `${base} Initialize git repository?` }]);

	const { dependencies } = await inquirer.prompt([
		{
			type: `input`,
			name: `dependencies`,
			message: `${base} Add extra dependencies:`,
		},
	]);

	info(`Creating new folder`);
	await shell(`mkdir ${pkg.name} && cd ${pkg.name}`).catch(() => true);

	if (git.git) {
		const git = await inquirer.prompt([
			{
				type: `input`,
				name: `user`,
				message: `${base} Enter your git username or organisation:`,
			},
			{
				type: `input`,
				name: `repo`,
				message: `${base} Enter the git repo name:`,
			},
			{
				type: `input`,
				name: `remote`,
				message: `${base} Enter the git remote name:`,
				default: `origin`,
			},
			{
				type: `input`,
				name: `branch`,
				message: `${base} Enter the git branch name:`,
				default: `main`,
			},
			{
				type: `confirm`,
				name: `pull`,
				message: `${base} Git pull before starting?`,
			},
			{
				type: `confirm`,
				name: `commit`,
				message: `${base} Git commit initial commit?`,
			},
		]);

		start();

		info(`Git initialising...`);
		await shell(`cd ${pkg.name} && git init`);
		success(`Git initialised. Creating branch: ${git.branch}`);
		await shell(`cd ${pkg.name} && git branch -M ${git.branch}`);
		success(`Git branch added: ${git.branch}. Adding remote: ${git.remote}`);
		await shell(`cd ${pkg.name} && git remote add ${git.remote} https://github.com/${git.user}/${git.repo}.git`);
		success(`Git remote added: ${git.remote}.`);
		templates.push(`.gitignore`, `.gitattributes`);

		if (git.pull) {
			info(`Git pulling with upstream...`);
			await shell(`cd ${pkg.name} && git pull --set-upstream ${git.remote} ${git.branch}`);
			success(`Git pulled with upstream.`);
		}

		if (git.commit) {
			info(`Adding files...`);
			await shell(`cd ${pkg.name} && git add .`);
			success(`Files added. Committing files.`);
			await shell(`cd ${pkg.name} && git commit -m "Initial commit"`);
			success(`Git committed initial commit.`);
		}

		pkg.repository = {
			type: `git`,
			url: `git+https://github.com/${git.user}/${git.repo}.git`,
		};

		pkg.bugs = `https://github.com/${git.user}/${git.repo}/issues`;
	}

	start();

	info(`Creating package.json...`);
	fs.writeFileSync(`${path.resolve(pkg.name)}/package.json`, JSON.stringify(pkg));

	info(`Installing dependencies:\n- ${dependencies.split(` `).join(`\n- `)}\n\nDev:\n- ${devDependencies.join(`\n- `)}`);
	start();
	await shell(`cd ${pkg.name} && npm i ${dependencies}`);
	await shell(`cd ${pkg.name} && npm i -D ${devDependencies.join(` `)}`);

	info(`Creating config files`);
	start();
	await templates.map((template) => {
		fs.copyFileSync(path.resolve(`./dummiyy/templates/${template}`), path.resolve(pkg.name, template));
	});

	info(`Creating folder structure...`);
	start();
	settings.root.map((folder: string) => shell(`cd ${pkg.name} && mkdir ${folder}`).catch(() => true));
	settings.structure.map((structure: string) => shell(`${settings.src ? `cd ${pkg.name}/src &&` : ''} mkdir ${structure}`).catch(() => true));

	info(`Creating entry file...`);
	start();
	await shell(`cd ${pkg.name} && touch ${settings.src ? `src/` : ''}main${settings.language === `JavaScript` ? `.js` : `.ts`}`);

	if (settings.format) await shell(`cd ${pkg.name} && npx prettier --write .`);
	stop();

	if (settings.type === `CLI`) {
		fs.writeFileSync(`${path.resolve(pkg.name)}/${settings.src ? 'src/' : ''}main.${settings.language == 'JavaScript' ? 'js' : 'ts'}`, `#!/usr/bin/env node`);
	}

	box(`Initialised project ${pkg.name} successfully! Use ${sharpyy(`cd ${pkg.name}`, `bgGray`)} to navigate to your project directory.`);

	process.exit();
})();
