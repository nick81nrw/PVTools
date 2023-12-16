import {RequestHandler} from "express";
let axios = require("axios")

export const relayAPIRequest:RequestHandler = ((req,res, next) => {
    if (!req.body.url.startsWith("https://re.jrc.ec.europa.eu/") &&
	!req.body.url.startsWith("https://nominatim.openstreetmap.org/")) {
        return res.send(403)
    }
    if(req.body.method == "GET"){
        axios.get(req.body.url)
            .then((result:any) => res.json(result.data))
            .catch((error:any) => console.error(error))
    } else {
        return res.send(403)
    }


})




