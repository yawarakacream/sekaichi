const env = (() => {
  let DATA_DIR = process.env.DATA_DIR;
  if (typeof DATA_DIR !== "string") throw new Error();
  if (DATA_DIR.startsWith("./") || DATA_DIR.startsWith("../")) {
    DATA_DIR = process.cwd() + "/" + DATA_DIR;
  }

  let BOX_API_CONFIG_PATH = DATA_DIR + "/" + process.env.BOX_API_CONFIG_PATH;

  return { DATA_DIR, BOX_API_CONFIG_PATH } as const;
})();

export default env;
