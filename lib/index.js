const path = require('path')
const crypto = require('crypto')
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const exec = require('child_process').exec
const chalk = require('chalk')

const handleError = err => {
	console.error(chalk.red(err, '\n', err.stack))
	process.exit(1)
}
const filterFileExtensions = (files, extensions) =>
	files.filter(file => extensions.indexOf(path.extname(file).slice(1)) > -1)

const filterFiles = (files, input) => files.filter(file => fs.statSync(path.join(input, file)).isFile())

const createFileHash = (file, input, output, publicPath) => fs.readFileAsync(path.join(input, file))
	.then(data => {
		const extName = path.extname(file).slice(1)
		const fileName = path.basename(file, `.${extName}`)
		const newName = `${fileName}.${crypto.createHash('md5')
			.update(data).digest('hex')}.${extName}`
		console.log(chalk.green(newName))
		const fileObject = {
			file: path.join(output, newName)
		}
		if (publicPath) {
			fileObject.public = path.join(publicPath, newName)
		}
		return fileObject
	})

const copyFiles = (file, output) => new Promise((resolve, reject) => {
	exec(`cp ${file} ${output}`, err => {
		if (err) return reject(err)
		return resolve(output)
	})
})

const hashFiles = (files, input, output, publicPath) => files.map(file =>
	createFileHash(file, input, output, publicPath)
		.then(hash => copyFiles(path.join(input, file), hash.file)
			.then(hashedPath => {
				const extName = path.extname(file).slice(1)
				const fileName = path.basename(file, `.${extName}`)
				return {
					[fileName]: {
						[extName]: hash.public || hash.file
					}
				}
			}))
		.catch(handleError)
)

const createManifestObject = manifestChunks => manifestChunks.reduce((a, c, i) => {
	const manifest = Object.assign(a, c)
	return manifest
}, {})

const createManifest = (obj, assetLocation = 'manifest.json') => fs.writeFileAsync(assetLocation, JSON.stringify(obj))
	.then(() => console.log('Manifest: %s', assetLocation))
	.catch(handleError)

const init = program => {
	if (program.dir && program.ext && program.output) {
		return fs.readdirAsync(program.dir)
			.then(files => {
				if (!fs.existsSync(program.output)) {
					fs.mkdirSync(program.output)
				}
				const filtered = program.all ? filterFiles(files, program.dir) : filterFileExtensions(filterFiles(files, program.dir), program.ext)
				console.log(chalk.cyan(`Generating files: ${program.dir}`))
				return Promise.all(
					hashFiles(filtered, program.dir, program.output, program.publicPath))
					.then(values => {
						createManifest(createManifestObject(values), program.assets)
					})
					.catch(handleError)
			})
			.catch(handleError)
	} else {
		program.help()
	}
}

module.exports = {
	init,
	handleError,
	filterFiles,
	filterFileExtensions,
	createFileHash,
	copyFiles,
	hashFiles,
	createManifestObject,
	createManifest
}
