
export function dateInPast(numberOfDays) {
    var today = getDateWithoutTimezone(new Date());
    var priorDate = new Date(new Date().setDate(today.getDate() - numberOfDays));
    return priorDate
}

export function dateInFuture(numberOfDays) {
    var today = getDateWithoutTimezone(new Date());
    var futureDate = new Date(new Date().setDate(today.getDate() + numberOfDays));
    return futureDate
}

export function addToDate(date, numberOfDays) {
    var futureDate = new Date(new Date().setDate(date + numberOfDays));
    return futureDate
}

export function substractToDate(date, numberOfDays) {
    var priorDate = new Date(new Date().setDate(date - numberOfDays));
    return priorDate
}

export function getDateWithoutTimezone(date) {
    var userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset);
}

    
export function formatDate(date, format) {
    const map = {
        mm: ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1),
        dd: ((date.getDate()) < 10 ? "0" : "") + (date.getDate()),
        yyyy: date.getFullYear()
    }

    return format.replace(/mm|dd|yyyy/gi, matched => map[matched])
}

export const API_DATE_FORMAT = 'yyyy-mm-dd'