module.exports = {
  hooks: {
    "pre-commit": "yarn pretty && yarn lint",
    "pre-push" : "if git-branch-is master; then yarn test; fi"
  }
}