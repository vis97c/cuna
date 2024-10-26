const { production, developtment } = require("@open-xamu-co/ui-styles/postcss");

/**
 * Optimized config
 */
module.exports = (process.env.NODE_ENV === "production" && production) || developtment;
