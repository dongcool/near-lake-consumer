const { exit } = require("process");

function readEnv (name) {
  return process.env[name] || console.error(`missing ${name} in env`) || exit(1)
}

module.exports = {
  readEnv,
}
