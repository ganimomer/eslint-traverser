# eslint-traverser
A utility that helps traverse code the way ESLint does.
This allows you to test any utilities you write for ESLint rules.

## Installation
```bash
npm install eslint-traverser
```

## Usage

### Common Usage
The module exposes a function that gets code and gets a traverser, with a `get` function.
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