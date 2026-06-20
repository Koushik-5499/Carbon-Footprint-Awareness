const fs = require('fs').promises;

/**
 * Read and parse a JSON file
 * @param {string} filePath 
 * @returns {Promise<any>}
 */
const readJSON = async (filePath) => {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
};

/**
 * Stringify and write data to a JSON file
 * @param {string} filePath 
 * @param {any} data 
 * @returns {Promise<void>}
 */
const writeJSON = async (filePath, data) => {
    await fs.writeFile(filePath, JSON.stringify(data, null, 4));
};

module.exports = {
    readJSON,
    writeJSON
};
