


module.exports = (year, consumption, profile) => {

    let currentDay = new Date('Jan 01 '+ year)
    const lastDay = new Date('Jan 01 '+ (year +1))
    // const lastDay = new Date('Jan 02 '+ year )
    
    const days = {}

    while (currentDay < lastDay) {

        for (let hour = 1; hour < 25; hour++) {

            const timeString = `${year}${('00' + (currentDay.getMonth())).slice(-2)}${('00' + currentDay.getDate()).slice(-2)}:${('00' + hour).slice(-2)}`
            const weekDay = currentDay.getDay() // 0 = sun, 1 = mon, ..., 6 = sat
            const temp = currentDay
            days[timeString] = {P:0, date:temp}
            
        }
        currentDay.setDate(currentDay.getDate() + 1)

    } 
    return days
}