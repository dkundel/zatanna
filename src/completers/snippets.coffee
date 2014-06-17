###
  This is essentially a copy from the snippet completer from Ace's ext/language-tools.js
###

module.exports = (SnippetManager) ->
  getCompletions: (editor, session, pos, prefix, callback) ->
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
          score: 999
          meta: (if s.tabTrigger and not s.name then s.tabTrigger + '\u21E5' else 'snippets')
    , @
    callback null, completions