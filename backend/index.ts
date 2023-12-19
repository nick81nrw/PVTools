import path from "path";
import express from "express"
import * as bodyParser from "body-parser"
import {relayAPIRequest} from "./api/relay";

/**
 * Setup some things so the frontend can communicate with the backend
 */
const app = express()
const cors = require('cors')

const ENV = process.env.NODE_ENV || 'development'

if (ENV === 'production') {
  app.use(cors({
    origin: `https://${process.env.APP_URL}`
  }))

} else {
  app.use(cors({
    origin: true
  }))
  
}


app.use(bodyParser.json())

/**
 * Open endpoints
 */
app.post("/relay", relayAPIRequest)

/**
 * Start server
 */
app.listen(process.env.REQUEST_PORT || 8082, () => {
  console.log("Server started with port: " + (process.env.REQUEST_PORT || 8082))
})
