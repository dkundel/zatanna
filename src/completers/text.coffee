_ = require 'lodash'
fuzzaldrin = require 'fuzzaldrin'
{Tokenizer} = ace.require 'ace/tokenizer'
{BackgroundTokenizer} = ace.require 'ace/background_tokenizer'
{Range} = ace.require 'ace/range'

splitRegex = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/

module.exports = (editor) ->
  dictionary = []

  getCurrentWord = (doc, pos) ->
    textBefore = doc.getTextRange(Range.fromPoints({row: 0, column:0}, pos))
    text = doc.getValue()
    text = text.substr textBefore.length
    text.split(splitRegex)[0]

  handleTokenUpdate = (e) ->
    newDictionary = []
    noLines = editor.getSession().getDocument().getLength()
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

  handleSpaceKey = 
    name: 'updateTokens'
    bindKey: 'Space'
    exec: (e) ->
      editor.insert ' '
      lastRow = editor.getSession().getLength()
      bgTokenizer.fireUpdateEvent 0, lastRow


  highlightRules = new (editor.getSession().getMode().HighlightRules)()
  tokenizer = new Tokenizer highlightRules.getRules()
  bgTokenizer = new BackgroundTokenizer tokenizer, editor
  bgTokenizer.on 'update', handleTokenUpdate
  bgTokenizer.setDocument editor.getSession().getDocument()
  bgTokenizer.start(0)

  editor.commands.addCommand handleSpaceKey

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
  result = check 'constant'
  result = result or check 'identifier'
  result = result or check 'variable'
  result = result or check 'keyword'
  result = result or check 'storage'
  result