'use strict'
const uniqueId = require('lodash/uniqueId')
const iteratee = require('lodash/iteratee')
const constant = require('lodash/constant')
const isFunction = require('lodash/isFunction')
const noop = require('lodash/noop')
const mapValues = require('lodash/mapValues')
const assign = require('lodash/assign')
const every = require('lodash/every')
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

const runOneTimeRule = (code, config, rule) => {
  const linter = require('eslint').linter
  const ruleId = uniqueId()
  linter.defineRule(ruleId, rule)
  const actualConfig = assign({}, config, {
    rules: {
      [ruleId]: 2
    },
    parserOptions: assign({
      ecmaVersion: 6
    }, config.parserOptions)
  })
  linter.verify(code, actualConfig)
}

const runOneTimeRuleForType = (code, config, type, logic) => {
  runOneTimeRule(code, config, context => ({
    [type](node) {
      logic(node, context)
    }
  }))
}

function isParserOption(key) {
  return key === 'ecmaVersion' || key === 'sourceType' || key === 'ecmaFeatures'
}

function isOnlyParserOptions(config) {
  return every(Object.keys(config), isParserOption)
}

module.exports = (code, config = {}) => {
  if (isOnlyParserOptions(config)) {
    config = {parserOptions: config}
  }
  if (!code) {
    throw Error('Code must be a string.')
  }
  if (config.rules) {
    throw Error('Do not specify rules in the config.')
  }
  return ({
    get(type = throwMessage(MISSING_TYPE), ...rest) {
      const {cb, matches} = getRestParams(rest)
      runOneTimeRuleForType(code, config, type, (node, context) => {
        if (matches(node)) {
          cb(node, context)
        }
      })
    },
    first(type = throwMessage(MISSING_TYPE), ...rest) {
      const {cb, matches} = getRestParams(rest)
      let found = false
      runOneTimeRuleForType(code, config, type, (node, context) => {
        if (matches(node) && !found) {
          found = true
          cb(node, context)
        }
      })
    },
    runRuleCode(rule) {
      runOneTimeRule(code, config, rule)
    },
    visitAll(visitors = {}, cb) {
      if (!isFunction(cb)) {
        throwMessage(MISSING_CB)
      }
      const origExitVisitor = visitors['Program:exit'] || noop
      runOneTimeRule(code, config, context => assign({}, visitors, {
        'Program:exit'(node) {
          origExitVisitor(node)
          cb(node, context)
        }
      }))
    }
  })
}