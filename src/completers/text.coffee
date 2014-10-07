fuzzaldrin = require 'fuzzaldrin'

splitRegex = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/

module.exports = (editor, bgTokenizer) ->
  {Range} = ace.require 'ace/range'
  
  dictionary = []

  getCurrentWord = (doc, pos) ->
    textBefore = doc.getTextRange(Range.fromPoints({row: 0, column:0}, pos))
    text = doc.getValue()
    text = text.substr textBefore.length
    text.split(splitRegex)[0]

  handleTokenUpdate = (e) ->
    bgTokenizer.setDocument editor.getSession().getDocument()
    newDictionary = []
    noLines = e.data.last
    for row in [0...noLines]
      tokens = bgTokenizer.getTokens row
      for tok in tokens
        continue unless checkToken tok
        newDictionary.push 
          caption: tok.value
          value: tok.value
          meta: 'local'
    dictionary = _.uniq newDictionary, (el) ->
      el.value

  bgTokenizer.on 'update', handleTokenUpdate

  getCompletions: (editor, session, pos, prefix, callback) ->
    completions = []
    noLines = session.getLength()
    word = getCurrentWord session, pos
    completions = fuzzaldrin.filter dictionary, word, key: 'value'
    for suggestion in completions
      suggestion.score = fuzzaldrin.score suggestion.value, word     
    callback null, completions

checkToken = (token) ->
  check = (parameter) ->
    (token.type.indexOf parameter) is 0
  result = (check('constant') and not check 'constant.numeric')
  result = result or check 'identifier'
  result = result or check 'variable'
  result = result or check 'keyword'
  result = result or check 'storage'
  result