// Calculator Plugin
export default {
  execute(a, b, op) {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    return 0;
  }
};
