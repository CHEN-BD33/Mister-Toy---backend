
import fs from 'fs'
import { utilService } from './util.service.js'
import { loggerService } from './logger.service.js'

export const toyService = {
    query,
    getById,
    remove,
    save
}

const PAGE_SIZE = 5
const toys = utilService.readJsonFile('data/toys.json')

async function query(filterBy = {}) {
    try {
        if (!filterBy.txt) filterBy.txt = ''
        if (!filterBy.maxPrice) filterBy.maxPrice = Infinity

        const regex = new RegExp(filterBy.txt, 'i')
        var toysToReturn = toys.filter(toy => regex.test(toy.name))

        if (filterBy.maxPrice !== Infinity) {
            toysToReturn = toysToReturn.filter(toy => toy.price <= filterBy.maxPrice)
        }

        if (filterBy.inStock !== undefined) {
            toysToReturn = toysToReturn.filter(toy => toy.inStock === filterBy.inStock)
        }

        if (filterBy.labels && filterBy.labels.length > 0) {
            toysToReturn = toysToReturn.filter(toy => {
                return filterBy.labels.every(label => toy.labels.includes(label))
            })
        }

        if (filterBy.sortBy) {
            const direction = filterBy.sortDir || 1
            switch (filterBy.sortBy) {
                case 'name':
                    toysToReturn.sort((a, b) => a.name.localeCompare(b.name))
                    break
                case 'price':
                    toysToReturn.sort((a, b) => a.price - b.price)
                    break
                case 'created':
                    toysToReturn.sort((a, b) => a.createdAt - b.createdAt)
                    break
            }
        }

        if (filterBy.pageIdx !== undefined) {
            const startIdx = filterBy.pageIdx * PAGE_SIZE
            toysToReturn = toysToReturn.slice(startIdx, startIdx + PAGE_SIZE)
        }

        return toysToReturn
    } catch (err) {
        loggerService.error('Cannot query toys', err)
        throw err
    }
}

async function getById(toyId) {
    try {
        const toy = toys.find(toy => toy._id === toyId)
        return toy
    } catch (err) {
        loggerService.error(`Cannot get toy ${toyId}`, err)
        throw err
    }
}

// loggedinUser
async function remove(toyId) {
    try {
        const idx = toys.findIndex(toy => toy._id === toyId)
        if (idx === -1) throw new Error('No Such Toy')

        // const toy = toys[idx]
        // if (!loggedinUser.isAdmin &&
        //     toy.owner._id !== loggedinUser._id) {
        //     throw new Error('Not your toy')
        // }
        toys.splice(idx, 1)
        await _saveToysToFile()
    } catch (err) {
        loggerService.error(`Cannot remove toy ${toyId}`, err)
        throw err
    }
}

// loggedinUser
async function save(toy) {
    try {
        if (toy._id) {
            const toyToUpdate = toys.find(currToy => currToy._id === toy._id)
            if (!toyToUpdate) throw new Error(`Toy not found: ${toy._id}`)

            // if (!loggedinUser.isAdmin &&
            //     toyToUpdate.owner._id !== loggedinUser._id) {
            //     throw new Error('Not your toy')
            // }
            toyToUpdate.name = toy.name
            toyToUpdate.price = toy.price
            toy = toyToUpdate
        } else {
            toy._id = utilService.makeId()
            toy.createdAt = Date.now()
            toy.inStock = true
            // toy.owner = loggedinUser
            toys.push(toy)
        }
        // delete toy.owner.score
        await _saveToysToFile()
        return toy
    } catch (err) {
        loggerService.error('Cannot save toy', err)
        throw err
    }
}


function _saveToysToFile() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(toys, null, 2)
        fs.writeFile('data/toys.json', data, (err) => {
            if (err) {
                loggerService.error('Cannot write to toys file', err)
                return reject(err)
            }
            resolve()
        })
    })
}