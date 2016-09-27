'use strict'
const uniqueId = require('lodash/uniqueId')
const iteratee = require('lodash/iteratee')
const constant = require('lodash/constant')
const isFunction = require('lodash/isFunction')
const noop = require('lodash/noop')
const mapValues = require('lodash/mapValues')
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

const runOneTimeRule = (code, parserOptions, rule) => {
  const linter = require('eslint').linter
  const ruleId = uniqueId()
  linter.defineRule(ruleId, rule)
  linter.verify(code, {
    rules: {
      [ruleId]: 2
    },
    parserOptions: assign({
      ecmaVersion: 6
    }, parserOptions)
  })
}

const runOneTimeRuleForType = (code, parserOptions, type, logic) => {
  runOneTimeRule(code, parserOptions, context => ({
    [type](node) {
      logic(node, context)
    }
  }))
}

module.exports = (code, parserOptions = {}) => {
  if (!code) {
    throw Error('Code must be a string.')
  }
  return ({
    get(type = throwMessage(MISSING_TYPE), ...rest) {
      const {cb, matches} = getRestParams(rest)
      runOneTimeRuleForType(code, parserOptions, type, (node, context) => {
        if (matches(node)) {
          cb(node, context)
        }
      })
    },
    first(type = throwMessage(MISSING_TYPE), ...rest) {
      const {cb, matches} = getRestParams(rest)
      let found = false
      runOneTimeRuleForType(code, parserOptions, type, (node, context) => {
        if (matches(node) && !found) {
          found = true
          cb(node, context)
        }
      })
    },
    runRuleCode(rule) {
      runOneTimeRule(code, parserOptions, rule)
    },
    visitAll(visitors = {}, cb) {
      if (!isFunction(cb)) {
        throwMessage(MISSING_CB)
      }
      const origExitVisitor = visitors['Program:exit'] || noop
      runOneTimeRule(code, parserOptions, context => assign({}, visitors, {
        'Program:exit'(node) {
          origExitVisitor(node)
          cb(node, context)
        }
      }))
    }
  })
}