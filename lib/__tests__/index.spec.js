const cachebuster = require('../index.js')
const fs = require('fs')
const exec = require('child_process').exec
const crypto = require('crypto')
const Promise = require('bluebird')
const sinon = require('sinon')

const mockedCachebuster = {
	init: cachebuster.init,
	handleError: jest.fn(),
	filterFiles: jest.fn(),
	filterFileExtensions: jest.fn(),
	createFileHash: jest.fn(),
	copyFiles: jest.fn(),
	hashFiles: jest.fn(),
	createManifestObject: jest.fn(),
	createManifest: jest.fn()
}

const files = [
	'foo.js',
	'foo.css',
	'bar.js',
	'bar.css',
	'dir',
	'dist'
]

describe('cachebuster-cli', () => {
	beforeAll(() => {
		fs.mkdirSync('./tmp')
		fs.mkdirSync('./tmp/dir')
		fs.mkdirSync('./tmp/dist')
		fs.writeFileSync('./tmp/foo.js', 'var a=1')
		fs.writeFileSync('./tmp/foo.css', '.head { color: white }')
		fs.writeFileSync('./tmp/bar.js', 'var a=1')
		fs.writeFileSync('./tmp/bar.css', '.head { color: white }')
	})

	afterAll(() => {
		exec('rm -rf tmp && rm manifest.json')
	})

	describe('handleError', () => {
		it('handles Errors', () => {
			global.process = {
				exit: jest.fn()
			}
			cachebuster.handleError('test')
			expect(process.exit).toBeCalled()
		})
	})

	describe('filterFiles', () => {
		it('filters files from directories in an array', () => {
			expect(cachebuster.filterFiles(files, './tmp')).toEqual([
				'foo.js',
				'foo.css',
				'bar.js',
				'bar.css'
			])
		})
	})

	describe('filterFileExtensions', () => {
		it('filters file extensions in an array', () => {
			expect(cachebuster.filterFileExtensions(files, ['css'])).toEqual([
				'foo.css',
				'bar.css'
			])
		})
	})

	describe('hashFiles', () => {
		it('creates an object containing a hashed filename', () => {
			const data = fs.readFileSync('./tmp/foo.js')
			const hashed = crypto.createHash('md5').update(data).digest('hex')
			return cachebuster.createFileHash('foo.js', './tmp', './tmp/dist').then(data => {
				expect(data).toEqual({
					file: `tmp/dist/foo.${hashed}.js`
				})
			})
		})

		it('creates an object containing a hashed filename with public Path', () => {
			const data = fs.readFileSync('./tmp/foo.js')
			const hashed = crypto.createHash('md5').update(data).digest('hex')
			return cachebuster.createFileHash('foo.js', './tmp', './tmp/dist', 'static/').then(data => {
				expect(data).toEqual({
					file: `tmp/dist/foo.${hashed}.js`,
					public: `static/foo.${hashed}.js`
				})
			})
		})
	})

	describe('copyFiles', () => {
		it('copies files to output folder', () =>
			cachebuster.copyFiles('tmp/foo.js', 'tmp/dist/foobar.js').then(output => {
				expect(output).toBe('tmp/dist/foobar.js')
			})
		)

		it('rejects promise', () =>
			cachebuster.copyFiles('tmp/test.js', 'tmp/dist/test.js').catch(err => {
				expect(err).toBeTruthy()
			}))
	})

	describe('hashFiles', () => {
		it('copies files with hashed names', () => {
			const filtered = cachebuster.filterFiles(files, 'tmp')
			return Promise.all(
				cachebuster.hashFiles(filtered, 'tmp', 'tmp/dist')
			).then(values => {
				expect(values).toHaveLength(filtered.length)
			})
		})
	})

	describe('manifest', () => {
		it('reduces an array of objects into a single object', () => {
			const manifestObject = cachebuster.createManifestObject([{a: 'b'}, {b: 'c'}])
			expect(manifestObject).toEqual({
				a: 'b',
				b: 'c'
			})
		})

		it('creates a manifest.json file', () =>
			cachebuster.createManifest({a: 'b'}).then(() =>
				expect(fs.statSync('manifest.json').isFile()).toBeTruthy()
			))
	})

	describe('init', () => {
		it('creates a manifest.json with a map of all generated files', () =>
			cachebuster.init({
				dir: 'tmp',
				ext: 'js',
				output: 'tmp/dist'
			}).then(() => {
				expect(fs.statSync('manifest.json').isFile()).toBeTruthy()
			}))
		it('creates a directory if it does not exist', () =>
			cachebuster.init({
				dir: 'tmp',
				ext: 'js',
				all: true,
				output: 'tmp/test'
			}).then(() => {
				expect(fs.statSync('manifest.json').isFile()).toBeTruthy()
				expect(fs.statSync('tmp/test').isDirectory()).toBeTruthy()
			}))
		it('calls program.help when not enough args are provided', () => {
			const help = jest.fn()
			cachebuster.init({
				help
			})
			expect(help).toBeCalled()
		})
	})
})
