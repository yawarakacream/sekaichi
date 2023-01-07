const requireString = (key: string) => {
  const value = process.env[key];
  if (typeof value !== "string") throw new Error();
  return value;
};

const env = (() => {
  let DATA_DIR = requireString("DATA_DIR");
  if (DATA_DIR.startsWith("./") || DATA_DIR.startsWith("../")) {
    DATA_DIR = process.cwd() + "/" + DATA_DIR;
  }

  let SQLITE3_FILE = DATA_DIR + "/" + requireString("SQLITE3_FILE");

  return { DATA_DIR, SQLITE3_FILE } as const;
})();

export default env;
