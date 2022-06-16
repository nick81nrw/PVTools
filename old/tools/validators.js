const { body, check } = require('express-validator');


const getDataSchema = [
    body('cityId').isInt({min:1,max:80000}),
    body('aspect').isInt({min:-90,max:90}),
    body('angle').isInt({min:0,max:90}),
    body('peakpower').isInt({min:1,max:50000}),
    body('consumption_year').isInt({min:1000,max:50000}),
    check('lon').optional().isFloat().custom((val , {req})=>{
        if (!req.body.lat) {
            throw new Error('lat is not presend')
        }
        return true
    }),
    check('lat').optional().isFloat().custom((val , {req})=>{
        if (!req.body.lon) {
            throw new Error('lon is not presend')
        }
        return true
    })
]
    




module.exports = {
    getDataSchema
}