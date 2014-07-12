###
  This is essentially a copy from the snippet completer from Ace's ext/language-tools.js
  However this completer assigns a score to the snippets to ensure that snippet suggestions are
  treated better in the autocomplete than local values
###
{score} = require 'fuzzaldrin'
{Range} = ace.require 'ace/range'

splitRegex = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/

module.exports = (SnippetManager) ->
  getCurrentWord = (doc, pos) ->
    textBefore = doc.getTextRange(Range.fromPoints({row: 0, column:0}, pos))
    text = doc.getValue()
    text = text.substr textBefore.length
    text.split(splitRegex)[0]

  getCompletions: (editor, session, pos, prefix, callback) ->
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
        completions.push 
          caption: caption
          snippet: s.content
          score: (score caption, word) + 0.1
          meta: (if s.tabTrigger and not s.name then s.tabTrigger + '\u21E5' else 'snippets')
    , @
    callback null, completions