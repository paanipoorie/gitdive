class Author {
  constructor({ name, email }) {
    this.name = name || 'Unknown';
    this.email = email || '';
  }

  toJSON() {
    return {
      name: this.name,
      email: this.email,
    };
  }
}

module.exports = Author;
