/** @format */

import sharpyy from 'sharpyy';
import ora, { Color } from 'ora';
import boxen from 'boxen';

const spinner = ora();
setInterval(() => {
	spinner.color = ['blue', 'green', 'yellow', 'cyan', 'magenta', 'red'][Math.floor(Math.random() * 6)] as Color;
}, 250);

export const base = `${sharpyy('DUMMI', 'txRainbow', 'bold')} |`;

export function box(message: string, title: string = '') {
	console.info(boxen(message, { title, padding: 1, borderStyle: 'round', textAlignment: 'center', fullscreen: (width) => [width, 5] }));
}

export function success(message: string) {
	spinner.succeed(`${base} ${message || ''}`);
}

export function info(message: string) {
	spinner.info(`${base} ${message || ''}`);
}

export function stop() {
	spinner.stop();
}

export function start() {
	spinner.start();
}
