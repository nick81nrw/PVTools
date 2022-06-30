import express from "express"
import * as bodyParser from "body-parser"
import {relayAPIRequest} from "./api/relay";

//import {processContactRequest} from "./api/contact";

/**
 * Setup some things so the frontend can communicate with the backend
 */
const app = express()
const cors = require('cors')

app.use(cors({
  origin: true
}))

app.use(bodyParser.json())

/**
 * Open endpoints
 */
app.get("/", (req, res, next) => {
  res.send("PV Tools")
})

//app.post("/contact", processContactRequest)

app.post("/relay", relayAPIRequest)

/**
 * Start server
 */
app.listen(process.env.REQUEST_PORT || 8082, () => {
  console.log("Server started with port: " + (process.env.REQUEST_PORT || 8082))
})
