require("dotenv").config();

const ARI_CONFIG = {
    url: process.env.ARI_URL || "http://localhost:8088",
    user: process.env.ARI_USER || "freshdesk",
    pass: process.env.ARI_PASS || "ahmed",
};

const APP_NAME = "valoro-tech-ivr";

const MENUS = {
    main: {
        sound: "custom/valoro/valoro-main-menu",
        options: {
            1: { action: "menu", target: "support" },
            0: { action: "operator" },
        },
    },
    support: {
        sound: "custom/valoro/valoro-support-menu",
        options: {
            1: { action: "record", type: "system_issue" },
            2: { action: "record", type: "account_issue" },
            3: { action: "record", type: "bug_report" },
            4: { action: "record", type: "integration_issue" },
            0: { action: "operator" },
        },
    },
};

module.exports = {
    ARI_CONFIG,
    APP_NAME,
    MENUS,
};
