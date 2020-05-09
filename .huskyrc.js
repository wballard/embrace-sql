module.exports = {
  hooks: {
    "pre-commit": "yarn pretty",
    "pre-push" : "if git-branch-is master; then yarn test; fi"
  }
}