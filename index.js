'use strict'
const uniqueId = require('lodash/uniqueId')
const iteratee = require('lodash/iteratee')
const constant = require('lodash/constant')
const isFunction = require('lodash/isFunction')
const noop = require('lodash/noop')
const assign = require('lodash/assign')
function throwMessage(message) {
  throw Error(message)
}

const MISSING_TYPE = 'Missing mandatory parameter - type - Must be a String'
const MISSING_CB = 'Missing mandatory parameter - cb - Must be a Function'
const getRestParams = rest => {
  const cb = rest.pop()
  if (!isFunction(cb)) {
    throwMessage(MISSING_CB)
  }
  const matches = iteratee(rest.pop() || constant(true))
  return {cb, matches}
}

const runOneTimeRule = (code, rule) => {
  const linter = require('eslint').linter
  const ruleId = uniqueId()
  linter.defineRule(ruleId, rule)
  linter.verify(code, {
    rules: {
      [ruleId]: 2
    },
    parserOptions: {
      ecmaVersion: 6
    }
  })
}

const runOneTimeRuleForType = (code, type, logic) => {
  runOneTimeRule(code, context => ({
    [type](node) {
      logic(node, context)
    }
  }))
}

module.exports = code => {
  if (!code) {
    throw Error('Code must be a string.')
  }
  return ({
    get(type = throwMessage(MISSING_TYPE), ...rest) {
      const {cb, matches} = getRestParams(rest)
      runOneTimeRuleForType(code, type, (node, context) => {
        if (matches(node)) {
          cb(node, context)
        }
      })
    },
    first(type = throwMessage(MISSING_TYPE), ...rest) {
      const {cb, matches} = getRestParams(rest)
      let found = false
      runOneTimeRuleForType(code, type, (node, context) => {
        if (matches(node) && !found) {
          found = true
          cb(node, context)
        }
      })
    },
    visitAll(visitors = {}, cb) {
      if (!isFunction(cb)) {
        throwMessage(MISSING_CB)
      }
      const origExitVisitor = visitors['Program:exit'] || noop
      runOneTimeRule(code, context => assign({}, visitors, {
        'Program:exit'(node) {
          origExitVisitor(node)
          cb(node, context)
        }
      }))
    }
  })
}