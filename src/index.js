import fs from 'fs'
import path from 'path'
import program from 'commander'
import webpack from 'webpack'
import MemoryFS from 'memory-fs'
import { buildConfig } from './webpack'

program
  .option('-o, --out-file <path>', 'Destination file path')
  .parse(process.argv)

const cwd = process.cwd()
const memfs = new MemoryFS()

const entry = program.args.map((item) => {
  if (path.isAbsolute(item)) {
    return item
  }

  return path.join(cwd, item)
})

const config = buildConfig(cwd, entry)
const compiler = webpack(config)

compiler.outputFileSystem = memfs

compiler.run((error, stats) => {
  if (error) {
    throw error
  } else if (stats.hasErrors()) {
    console.log(stats.toString('minimal')) // eslint-disable-line no-console

    return
  }

  memfs.readdirSync(config.output.path).forEach((file) => {
    if (/\.css?$/.test(file)) {
      const target = path.join(config.output.path, file)

      fs.writeFileSync(program.outFile, memfs.readFileSync(target))
    }
  })
})
