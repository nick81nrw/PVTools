import {RequestHandler} from "express";
import axios from "axios";

const ALLOWED_HOSTS = ["re.jrc.ec.europa.eu", "nominatim.openstreetmap.org"]

// Nominatim blocks requests without a meaningful User-Agent (HTTP 403), see
// https://operations.osmfoundation.org/policies/nominatim/
const USER_AGENT = process.env.RELAY_USER_AGENT || "PVTools/1.0 (https://github.com/nick81nrw/PVTools)"
const NOMINATIM_EMAIL = process.env.NOMINATIM_EMAIL

const parseAllowedUrl = (rawUrl: unknown): URL | null => {
    if (typeof rawUrl !== "string") return null
    try {
        const url = new URL(rawUrl)
        if (url.protocol !== "https:" || !ALLOWED_HOSTS.includes(url.hostname)) return null
        return url
    } catch {
        return null
    }
}

export const relayAPIRequest: RequestHandler = async (req, res) => {
    const url = parseAllowedUrl(req.body?.url)
    if (!url || req.body.method !== "GET") {
        return res.sendStatus(403)
    }

    if (url.hostname === "nominatim.openstreetmap.org" && NOMINATIM_EMAIL && !url.searchParams.has("email")) {
        url.searchParams.set("email", NOMINATIM_EMAIL)
    }

    try {
        const result = await axios.get(url.toString(), {
            headers: {"User-Agent": USER_AGENT},
            timeout: 60000,
        })
        return res.json(result.data)
    } catch (error: any) {
        // Pass the upstream status (e.g. PVGIS 400 for invalid years, 429 rate limit) to the client
        const status = error.response?.status || 502
        console.error(`Relay request to ${url.hostname} failed with status ${status}: ${error.message}`)
        return res.status(status).json(error.response?.data || {message: "Upstream request failed"})
    }
}
