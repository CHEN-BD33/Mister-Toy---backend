// import fs from 'fs'
import { promises as fs } from 'fs'

export const loggerService = {
    debug(...args) {
        doLog('DEBUG', ...args)
    },
    info(...args) {
        doLog('INFO', ...args)
    },
    warn(...args) {
        doLog('WARN', ...args)
    },
    error(...args) {
        doLog('ERROR', ...args)
    }
}

const logsDir = './logs'

async function initLogsDir() {
    try {
        await fs.mkdir(logsDir, { recursive: true })
    } catch (err) {
        console.log('FATAL: cannot create logs directory', err)
    }
}

initLogsDir()

//define the time format
function getTime() {
    let now = new Date()
    return now.toLocaleString('he')
}

function isError(e) {
    return e && e.stack && e.message
}


async function doLog(level, ...args) {
    const strs = args.map(arg =>
        (typeof arg === 'string' || isError(arg)) ? arg : JSON.stringify(arg)
    )
    const line = `${getTime()} - ${level} - ${strs.join(' | ')}\n`
    console.log(line)

    try {
        await fs.appendFile(`${logsDir}/backend.log`, line)
    } catch (err) {
        console.log('FATAL: cannot write to log file', err)
    }
}