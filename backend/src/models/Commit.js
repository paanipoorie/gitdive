class Commit {
  constructor({ hash, author, date, message, parents = [], branches = [], files = [], additions = 0, deletions = 0 }) {
    this.hash = hash;
    this.shortHash = hash ? hash.substring(0, 7) : '';
    this.author = author;
    this.date = date;
    this.message = message;
    this.parents = parents;
    this.branches = branches;
    this.files = files;
    this.additions = additions;
    this.deletions = deletions;
  }

  toJSON() {
    return {
      hash: this.hash,
      shortHash: this.shortHash,
      author: typeof this.author?.toJSON === 'function' ? this.author.toJSON() : this.author,
      date: this.date,
      message: this.message,
      parents: this.parents,
      branches: this.branches,
      files: this.files,
      additions: this.additions,
      deletions: this.deletions,
    };
  }
}

module.exports = Commit;
