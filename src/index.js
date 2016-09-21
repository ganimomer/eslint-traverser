'use strict'
const uniqueId = require('lodash/uniqueId')
const iteratee = require('lodash/iteratee')
const constant = require('lodash/constant')
const isFunction = require('lodash/isFunction')
function throwMessage(message) {
  throw Error(message)
}

const MISSING_TYPE = 'Missing mandatory parameter - type - Must be a String'

module.exports = code => {
  if (!code) {
    throw Error('Code must be a string.')
  }
  return ({
    get(type = throwMessage(MISSING_TYPE), ...rest) {
      const cb = rest.pop()
      if (!isFunction(cb)) {
        throwMessage('Missing mandatory parameter - cb - Must be a Function')
      }
      const matches = iteratee(rest.pop() || constant(true))
      const linter = require('eslint').linter
      const ruleId = uniqueId()
      linter.defineRule(ruleId, context => ({
        [type](node) {
          if (matches(node)) {
            cb(node, context)
          }
        }
      }))
      linter.verify(code, {
        rules: {
          [ruleId]: 2
        }
      })
    }
  })
}