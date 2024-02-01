const UNMISTAKABLE_CHARS =
  '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';

module.exports = {
  /**
   * Generates a random id-string of given length.
   * The string will consist of characters from the following list:
   * `23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz`
   * @param count {number} length of the id
   * @returns {string} the generated id string
   */
  id(count = 17) {
    let res = '';
    for (let i = 0; i < count; i++) {
      res +=
        UNMISTAKABLE_CHARS[
          Math.floor(Math.random() * UNMISTAKABLE_CHARS.length)
        ];
    }
    return res;
  },
};
