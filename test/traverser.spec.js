'use strict'

const traverser = require('../src/index.js')
const RuleContext = require('eslint/lib/rule-context')
describe('eslint-traverser', () => {
  it('should throw if no code is given', () => {
    expect(() => traverser()).toThrowError('Code must be a string.')
  })
  it('should return an object with a get for actual code', () => {
    expect(typeof traverser('var x')).toBe('object')
    expect(typeof traverser('var x').get).toBe('function')
  })
  it('should accept a second object of config and apply it', done => {
    traverser('import _ from "lodash"', {parserOptions: {sourceType: 'module'}})
      .get('Program:exit', () => {
        done()
      })
  })
  it('should make that object parserOptions if it only has parserOptions keys', done => {
    traverser('import _ from "lodash"', {sourceType: 'module'})
      .get('Program:exit', () => {
        done()
      })
  })
  it('should throw if the config options passes a rules object', () => {
    expect(() => traverser('var x', {rules: {}})).toThrowError('Do not specify rules in the config.')
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
  describe('visitAll', () => {
    it('should throw a message if no CB is specified', () => {
      expect(() => traverser('var x').visitAll()).toThrowError('Missing mandatory parameter - cb - Must be a Function')
    })
    it('should call the CB on Program:exit with visitors undefined', done => {
      traverser('var x').visitAll(undefined, (node, context) => {
        expect(node.type).toBe('Program')
        expect(context instanceof RuleContext).toBe(true)
        done()
      })
    })
    it('should visit relevant visitors before the CB', done => {
      const callExpressionVisitor = jasmine.createSpy('CallExpression')
      const identifierVisitor = jasmine.createSpy('Identifier')
      const binaryExpressionVisitor = jasmine.createSpy('binaryExpression')
      traverser('var y = f(x)').visitAll({
        CallExpression: callExpressionVisitor,
        Identifier: identifierVisitor,
        BinaryExpression: binaryExpressionVisitor
      }, () => {
        expect(callExpressionVisitor).toHaveBeenCalled()
        expect(identifierVisitor).toHaveBeenCalled()
        expect(binaryExpressionVisitor).not.toHaveBeenCalled()
        done()
      })
    })
    it('should visit Program:exit before the CB if there is such a visitor', done => {
      const programExitVisitor = jasmine.createSpy('ProgramExit')
      traverser('var x').visitAll({
        'Program:exit': programExitVisitor
      }, node => {
        expect(programExitVisitor).toHaveBeenCalledWith(node)
        done()
      })
    })
  })
  describe('runRuleCode', () => {
    it('should run the code for a given rule', done => {
      traverser('var y = f(x)')
        .runRuleCode(context => ({
          CallExpression(node) {
            expect(node.type).toBe('CallExpression')
            done()
          }
        }))
    })
  })
})
