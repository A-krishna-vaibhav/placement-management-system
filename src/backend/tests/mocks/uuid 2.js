let _counter = 0;
const v4 = () => `mock-uuid-${++_counter}-${Date.now()}`;
module.exports = { v4 };
