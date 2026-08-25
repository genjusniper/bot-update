import fs from "fs";

const MAP_FILE = "./memory/lid-map.json";

function loadMap() {
    try {
        if (!fs.existsSync(MAP_FILE)) {
            return {
                lidToPn: {},
                pnToLid: {},
                updatedAt: null
            };
        }

        const data = JSON.parse(
            fs.readFileSync(MAP_FILE, "utf8")
        );

        return {
            lidToPn:
                data?.lidToPn &&
                typeof data.lidToPn === "object"
                    ? data.lidToPn
                    : {},

            pnToLid:
                data?.pnToLid &&
                typeof data.pnToLid === "object"
                    ? data.pnToLid
                    : {},

            updatedAt: data?.updatedAt || null
        };
    } catch {
        return {
            lidToPn: {},
            pnToLid: {},
            updatedAt: null
        };
    }
}

let map = loadMap();

function saveMap() {
    map.updatedAt = new Date().toISOString();

    fs.writeFileSync(
        MAP_FILE,
        JSON.stringify(map, null, 2),
        "utf8"
    );
}

/*
 * Semua format berikut:
 *
 * 6281935596653@s.whatsapp.net
 * 6281935596653:0@s.whatsapp.net
 * 6281935596653:12@s.whatsapp.net
 *
 * menjadi:
 *
 * 6281935596653@s.whatsapp.net
 */
export function normalizeCanonicalJid(jid) {
    if (!jid || typeof jid !== "string") {
        return null;
    }

    if (jid.endsWith("@lid")) {
        return map.lidToPn[jid] || jid;
    }

    if (jid.endsWith("@s.whatsapp.net")) {
        const number = jid
            .split("@")[0]
            .split(":")[0];

        if (/^\d+$/.test(number)) {
            return `${number}@s.whatsapp.net`;
        }
    }

    if (/^\d+$/.test(jid)) {
        return `${jid}@s.whatsapp.net`;
    }

    return jid;
}

export function rememberIdentity(lid, pn) {
    if (
        !lid ||
        !pn ||
        !lid.endsWith("@lid")
    ) {
        return false;
    }

    const canonicalPn =
        normalizeCanonicalJid(pn);

    if (
        !canonicalPn ||
        !canonicalPn.endsWith("@s.whatsapp.net")
    ) {
        return false;
    }

    map.lidToPn[lid] = canonicalPn;
    map.pnToLid[canonicalPn] = lid;

    saveMap();

    console.log(
        `🆔 Identity saved: ${lid} ↔ ${canonicalPn}`
    );

    return true;
}

export function getIdentity(jid) {
    const canonical =
        normalizeCanonicalJid(jid);

    return {
        raw: jid,
        canonical,
        type:
            jid?.endsWith("@lid")
                ? "LID"
                : "PN"
    };
}

export function getIdentityStats() {
    return {
        mappings: Object.keys(map.lidToPn).length,
        identities: Object.keys(map.pnToLid).length,
        updatedAt: map.updatedAt
    };
}
