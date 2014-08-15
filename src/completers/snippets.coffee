###
  This is essentially a copy from the snippet completer from Ace's ext/language-tools.js
  However this completer assigns a score to the snippets to ensure that snippet suggestions are
  treated better in the autocomplete than local values
###
{score} = require 'fuzzaldrin'

splitRegex = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/
splitRegexExtensive = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w\.\@]+/

module.exports = (SnippetManager, languagePrefixes) ->
  {Range} = ace.require 'ace/range'
  util = ace.require 'ace/autocomplete/util'
  
  getPreviousWord = (doc, pos) ->
    pos.column--
    textRow = doc.getTextRange(Range.fromPoints({row: pos.row, column: 0}, pos))
    words = textRow.split splitRegexExtensive
    return if words.length > 0 then words[words.length-1] else ''

  getCurrentWord = (doc, pos) ->
    textBefore = doc.getTextRange(Range.fromPoints({row: 0, column:0}, pos))
    text = doc.getValue()
    text = text.substr textBefore.length
    text.split(splitRegex)[0]

  getCompletions: (editor, session, pos, prefix, callback) ->
    line = session.getLine pos.row
    prefix = util.retrievePrecedingIdentifier line, pos.column
    previousWord = getPreviousWord session, pos
    word = getCurrentWord session, pos
    snippetMap = SnippetManager.snippetMap
    completions = []
    SnippetManager.getActiveScopes(editor).forEach (scope) ->
      snippets = snippetMap[scope] or []
      i = snippets.length
      while i--
        s = snippets[i]
        caption  = s.name or s.tabTrigger
        unless caption
          continue
        removePrefix = (languagePrefixes.indexOf(previousWord) > -1 and s.content.indexOf(previousWord) is 0)
        completions.push 
          caption: caption
          snippet: if removePrefix then s.content.substr(previousWord.length) else s.content
          score: (score caption, word) + 0.1
          meta: (if s.tabTrigger and not s.name then s.tabTrigger + '\u21E5' else 'snippets')
    , @
    callback null, completions