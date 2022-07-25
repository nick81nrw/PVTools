
const SLP = require('./SLP')
const calcProfile = require('./calcProfile')

describe.only('test SPL functions', () => {
    const results = calcProfile(2021, 5000)
    test('results length are as long then the year', () => {
        expect(Object.keys(results).length).toBe(365 * 24)
    })
    test('results length are as long then the year in leap year', () => {
        const results = calcProfile(2016, 5000)
        expect(Object.keys(results).length).toBe(366 * 24)
    })
    test('one result should be ab object', () => {
        expect(typeof results).toBe('object')
    })
    test('one result should have the following keys', () => {
        expect(results['20210101:05']).toEqual({
            
        })
    })



})