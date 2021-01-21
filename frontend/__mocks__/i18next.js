class MockI18n {
  init() {}
  on() {}
  t(i) {
    return i;
  }
  use() {
    return this;
  }
}

export default new MockI18n();
