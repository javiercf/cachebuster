#!/usr/bin/env node
const program = require('commander')
const cachebuster = require('./lib').init
const list = val => val.split(',')

program
	.version('1.0.0')
	.option('-d, --dir <dir>', 'Input directory')
	.option('-o, --output <dir>', 'Output directory')
	.option('-p, --public-path <dir>', 'Public path for assets in manifest')
	.option('-e, --ext <extensions>', 'List of extensions to be parsed', list)
	.option('-a, --assets <file>', 'file in which to write manifest, by default manifest.json')
	.option('--all', 'Parse all extensions in input directory')
	.parse(process.argv)

cachebuster(program)
