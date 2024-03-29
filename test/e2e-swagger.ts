import { before } from '@nestjs/swagger/dist/plugin'

module.exports.name = 'nestjs-swagger-transformer'
// you should change the version number anytime you change the configuration below - otherwise, jest will not detect changes
module.exports.version = 1

module.exports.factory = (cs) => {
  return before(
    {
      // @nestjs/swagger/plugin options (can be empty)
    },
    cs.tsCompiler.program,
  )
}
