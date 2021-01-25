const jsonstore = require('./jsonstore')

beforeEach(() => {
    jsonstore.clear()
})

test('has', () => {
    expect(jsonstore.has('bob')).toBe(false)
    jsonstore.set('bob', '')
    expect(jsonstore.has('bob')).toBe(true)
    jsonstore.remove('bob')
    expect(jsonstore.has('bob')).toBe(false)
})

test('set/get', () => {
    jsonstore.set('bob', { token: '5' })
    expect(jsonstore.get('bob').token).toBe('5')
})

test('get defaults', () => {
    expect(jsonstore.get('bob', 'roger')).toBe('roger')
    expect(() => {
        jsonstore.get('bob', null)
    }).toThrow('no entry for bob, and no default given')
    var undef
    expect(() => {
        jsonstore.get('bob', undef)
    }).toThrow('no entry for bob, and no default given')
})