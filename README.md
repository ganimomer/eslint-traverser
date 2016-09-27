[![Build Status](https://travis-ci.org/ganimomer/eslint-traverser.svg?branch=master)](https://travis-ci.org/ganimomer/eslint-traverser)
[![Coverage Status](https://coveralls.io/repos/github/ganimomer/eslint-traverser/badge.svg?branch=master)](https://coveralls.io/github/ganimomer/eslint-traverser?branch=master)
[![NPM version](http://img.shields.io/npm/v/eslint-traverser.svg?style=flat-square)](https://npmjs.org/package/eslint-traverser) 

# eslint-traverser
A utility that helps traverse code the way ESLint does.
This allows you to test any utilities you write for ESLint rules.

## Installation
```bash
npm install eslint-traverser
```

## Usage

### Common Usage
The module exposes a function that gets code and an optional `parserOptions` object, and gets a traverser, with a `get` function.
The `get` function calls the callback for every `node` of the type, with `node` and `context` parameters,
 which are the same as the ones in ESLint itself. 
```js
const traverse = require('eslint-traverser')

traverse('var y = f(x)')
    .get('CallExpression', (node, context) => {
      console.log(node.callee.name) //logs `f`
      sourceCode = context.getSourceCode()
      //...
    })
```

#### Using parser options
You can define additional parserOptions (e.g. JSX or ES6 modules) using a second parameter in the call to `traverser`.
const traverse = require('eslint-traverser')

```js
const traverse = require('eslint-traverser')

traverse('import foo from "bar"', {sourceType: module})
    .get('Program:exit', (node, context) => {
      console.log('Modules!')
    })
```
#### Using a selector
You can also filter results using a selector, which can be a function or any of the iteratees supplied by [Lodash](https://lodash.com)

```js
const traverse = require('eslint-traverser')

traverse('f(); g(x)')
    .get('CallExpression', node => node.arguments.length, (node, context) => {
      console.log(node.callee.name) //logs `g`
      //...
    })
    
traverse('f(); g(x)')
    .get('CallExpression', 'arguments.length', node => {
      console.log(node.callee.name) //logs `g`
      //...
    })
    
traverse('f(); g(x)')
    .get('CallExpression', ['arguments.length', 0], node => {
      console.log(node.callee.name) //logs `f`
      //...
    })
    
traverse('f(); g(x)')
    .get('CallExpression', {callee: {name: 'g'}}, node => {
      console.log(node.callee.name) //logs `g`
      //...
    })    
```

### Using the `first` method
The `first` method is the same as the `get` method, except it only calls the callback on the first result, while `get` calls it on all the results

```js
const traverse = require('eslint-traverser')
traverse('f(); g()')
    .get('CallExpression', node => {
      console.log(node.callee.name) 
    })
// f
// g

traverse('f(); g()')
    .first('CallExpression', node => {
      console.log(node.callee.name)
    })
// f
```

### Using the `visitAll` method
The `visitAll` method gets two arguments: first, an optional `visitors` object in the same structure as an ESLint rule visitor object.
The second is a callback, that gets called at the end of the code traversal with two arguments: the `Program` node and the context.

```js
const traverse = require('eslint-traverser')
traverse('var y = f(x)')
    .visitAll((node, context) => {
      console.log(node.type) //Program
      
    })

traverse('var y = f(x)')
    .visitAll({
      CallExpression(node) { console.log('Call expression!')}
    }, () => { console.log('finished!')})
// Call expression!
// finished!
```

### Using the `runRuleCode` method
The `runRuleCode` method gets one argument: the rule. This runs an ESLint rule (a function that gets a context and returns a visitors object) on the specified code.

```js
const traverse = require('eslint-traverser')
traverse('var y = f(x)')
    .runRuleCode(context => ({
      CallExpression(node) { console.log('Call expression!')}
    }))
// Call expression!
```