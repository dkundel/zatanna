###
  This is essentially a copy from the snippet completer from Ace's ext/language-tools.js
  However this completer assigns a score to the snippets to ensure that snippet suggestions are
  treated better in the autocomplete than local values
###
{score} = require 'fuzzaldrin'

module.exports = (SnippetManager, languagePrefixes) ->
  {Range} = ace.require 'ace/range'
  util = ace.require 'ace/autocomplete/util'
  
  getCurrentWord = (doc, pos) ->
    end = pos.column
    start = end - 1
    text = doc.getLine(pos.row)
    start-- while start >= 0 and not text[start].match /\s+|[\.\@]/
    start++ if start >= 0
    text = text.substring start, end

  trimSnippet = (snippet, caption, line, prefix, pos) ->
    # trim snippet prefix and suffix if already in the document (line)
    captionStart = snippet.indexOf caption
    prefixStart = snippet.toLowerCase().indexOf(prefix.toLowerCase())
    if captionStart > -1 and captionStart is prefixStart
      snippetPrefix = snippet.substring 0, captionStart
      if pos.column - prefix.length - snippetPrefix.length >= 0
        linePrefix = line.substr pos.column - prefix.length - snippetPrefix.length, snippetPrefix.length
      else
        linePrefix = ''
      snippetSuffix = snippet.substring snippetPrefix.length + caption.length
      lineSuffix = line.substr pos.column, snippetSuffix.length
      if snippetPrefix.length > 0 and snippetPrefix is linePrefix
        snippet = snippet.slice snippetPrefix.length 
      if snippetSuffix.length > 0 and snippetSuffix is lineSuffix
        snippet = snippet.slice 0, snippet.length - snippetSuffix.length
    snippet

  getCompletions: (editor, session, pos, prefix, callback) ->
    line = session.getLine pos.row
    prefix = util.retrievePrecedingIdentifier line, pos.column
    word = getCurrentWord session, pos
    snippetMap = SnippetManager.snippetMap
    completions = []
    SnippetManager.getActiveScopes(editor).forEach (scope) ->
      snippets = snippetMap[scope] or []
      i = snippets.length
      while i--
        s = snippets[i]
        caption  = s.name or s.tabTrigger
        continue unless caption
        completions.push 
          caption: caption
          snippet: trimSnippet s.content, caption, line, prefix, pos
          score: (score caption, word) + 0.1
          meta: (if s.tabTrigger and not s.name then s.tabTrigger + '\u21E5' else 'snippets')
    , @
    callback null, completions