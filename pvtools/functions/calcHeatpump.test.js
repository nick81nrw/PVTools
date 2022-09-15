const {calcHeatingTempMap} = require('./calcHeatpump')


describe('calculate heating temperature',() => {
    test('test failure input parameters', () => {
        expect(() => calcHeatingTempMap({tempMap:1})).toThrow('maxHeatTemp not given')
        expect(() => calcHeatingTempMap({maxHeatTemp: 15})).toThrow('tempMap is not given')
        expect(() => calcHeatingTempMap({maxHeatTemp: 15, tempMap:'text'})).toThrow('tempMap is not an array')
        expect(() => calcHeatingTempMap({maxHeatTemp: 15, tempMap:[]})).toThrow('tempMap length must be greater then 0')
        expect(() => calcHeatingTempMap({maxHeatTemp: 15, tempMap:['text']})).toThrow('tempMap elements must be also an array')
        expect(() => calcHeatingTempMap({maxHeatTemp: 15, tempMap:[[1]]})).toThrow('tempMap elements must be also an array with the length of 2')
    })
    test('test temp calculations', () => {
        const calc = calcHeatingTempMap({minHeatTemp: -25, maxHeatTemp: 18, tempMap:[[-20,50],[-10,40],[10,30],[15,26]] } )
        expect(calc[2]).toBe(34)
    })
})