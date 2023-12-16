
const fs = require('fs')
const {convertConsumptionCSV,createTemplateCsv} = require('./convertConsumpionUploads')


const csvData = fs.readFileSync(__dirname + '/ImportTest.csv','utf8')



describe('read csv file', ()=> {
    test('result has entries', ()=>{
        const result = convertConsumptionCSV(csvData, 2023)
        console.log(result)
        expect(typeof result == 'object' ).toBe(true)
    })
    // test('createCsv', ()=> {
    //     const csv = createTemplateCsv(2023)
    //     // fs.writeFileSync(__dirname+'/TEST.csv',csv)
    //     expect(csv.length).toBe(2333)
    // })
    
})


