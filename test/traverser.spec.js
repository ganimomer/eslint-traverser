'use strict'

const traverser = require('../index.js')
const RuleContext = require('eslint/lib/rule-context')
describe('eslint-traverser', () => {
  it('should throw if no code is given', () => {
    expect(() => traverser()).toThrowError('Code must be a string.')
  })
  it('should return an object with a get for actual code', () => {
    expect(typeof traverser('var x')).toBe('object')
    expect(typeof traverser('var x').get).toBe('function')
  })
  describe('get', () => {
    it('should throw an error for a get without a type', () => {
      expect(() => traverser('var x').get(undefined)).toThrowError('Missing mandatory parameter - type - Must be a String')
    })

    it('should throw an error for a get without a cb', () => {
      expect(() => traverser('var x').get('Identifier')).toThrowError('Missing mandatory parameter - cb - Must be a Function')
    })

    it('should call the cb with the first item of the type if no selector is given', done => {
      traverser('f(g(x))')
        .get('CallExpression', node => {
          expect(node.callee.name).toBe('f')
          done()
        })
    })

    it('should call the cb with the node that matches the iteratee', done => {
      const iteratee = node => node.callee.name === 'f'
      traverser('f(g(x))')
        .get('CallExpression', iteratee, node => {
          expect(node.callee.name).toBe('f')
          done()
        })
    })

    it('should work with property shorthand', done => {
      traverser('f(); g(x)')
        .get('CallExpression', 'arguments.length', node => {
          expect(node.callee.name).toBe('g')
          done()
        })
    })

    it('should work with matches shorthand', done => {
      traverser('f(g(x))')
        .get('CallExpression', {callee: {name: 'g'}}, node => {
          expect(node.callee.name).toBe('g')
          done()
        })
    })

    it('should work with matches property shorthand', done => {
      traverser('f(g(x))')
        .get('CallExpression', ['callee.name', 'g'], node => {
          expect(node.callee.name).toBe('g')
          done()
        })
    })

    it('should call the callback with a context and node', done => {
      const traversal = traverser('var y = f(x)')
      traversal.get('CallExpression', (node, context) => {
        expect(context instanceof RuleContext).toBe(true)
        expect(node.type).toBe('CallExpression')
        done()
      })
    })

    it('should work with es6 syntax', done => {
        traverser('const T = () => true').get('ArrowFunctionExpression', () => {
          done()
        })
    })
  })
  describe('first', () => {
    it('should throw an error without a type', () => {
      expect(() => traverser('var x').first(undefined)).toThrowError('Missing mandatory parameter - type - Must be a String')
    })

    it('should throw an error without a cb', () => {
      expect(() => traverser('var x').first('Identifier')).toThrowError('Missing mandatory parameter - cb - Must be a Function')
    })

    it('should call the cb with the first item of the type if no selector is given', done => {
      traverser('f(g(x))')
        .first('CallExpression', node => {
          expect(node.callee.name).toBe('f')
          done()
        })
    })

    it('should call the cb with the node that matches the iteratee', done => {
      const iteratee = node => node.callee.name === 'f'
      traverser('f(g(x))')
        .first('CallExpression', iteratee, node => {
          expect(node.callee.name).toBe('f')
          done()
        })
    })

    it('should not call the cb for any other nodes but the first', () => {
      const cb = jasmine.createSpy('cb')
      traverser('f(g(x))')
        .first('CallExpression', cb)
      expect(cb.calls.count()).toBe(1)
    })

    it('should work with property shorthand', done => {
      traverser('f(); g(x)')
        .first('CallExpression', 'arguments.length', node => {
          expect(node.callee.name).toBe('g')
          done()
        })
    })

    it('should work with matches shorthand', done => {
      traverser('f(g(x))')
        .first('CallExpression', {callee: {name: 'g'}}, node => {
          expect(node.callee.name).toBe('g')
          done()
        })
    })

    it('should work with matches property shorthand', done => {
      traverser('f(g(x))')
        .first('CallExpression', ['callee.name', 'g'], node => {
          expect(node.callee.name).toBe('g')
          done()
        })
    })

    it('should call the callback with a context and node', done => {
      const traversal = traverser('var y = f(x)')
      traversal.first('CallExpression', (node, context) => {
        expect(context instanceof RuleContext).toBe(true)
        expect(node.type).toBe('CallExpression')
        done()
      })
    })

    it('should work with es6 syntax', done => {
      traverser('const T = () => true').first('ArrowFunctionExpression', () => {
        done()
      })
    })
  })
})